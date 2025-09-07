import { BaseAgent } from '../base-agent';
import { Logger } from 'winston';
import { AgentOrchestrator, AgentMessage } from '../orchestrator';

interface ResponsePriority {
  priorityId: string;
  disasterId: string;
  priorityLevel: 1 | 2 | 3 | 4 | 5; // 1 = highest, 5 = lowest
  category: 'life_safety' | 'property_protection' | 'infrastructure' | 'environment' | 'economic';
  actions: PrioritizedAction[];
  resources: ResourceAllocation[];
  timeline: {
    immediate: string[];  // 0-1 hour
    urgent: string[];     // 1-6 hours
    important: string[];  // 6-24 hours
    routine: string[];    // 24+ hours
  };
  estimatedResolution: number; // hours
}

interface PrioritizedAction {
  actionId: string;
  description: string;
  priority: number;
  assignedTo: string;
  status: 'pending' | 'in_progress' | 'completed';
  deadline: Date;
  dependencies: string[];
}

interface ResourceAllocation {
  resourceType: string;
  quantity: number;
  location: string;
  status: 'available' | 'deployed' | 'en_route';
  estimatedArrival?: number; // minutes
}

interface DisasterPriority {
  disasterId: string;
  overallPriority: number;
  factors: {
    casualties: number;
    displaced: number;
    economicImpact: number;
    infrastructureDamage: number;
    timeUntilImpact: number;
  };
  score: number;
}

export class PriorityManagerAgent extends BaseAgent {
  private priorities: Map<string, ResponsePriority> = new Map();
  private disasterQueue: DisasterPriority[] = [];
  private resourcePool: Map<string, ResourceAllocation[]> = new Map();
  private actionQueue: PrioritizedAction[] = [];

  constructor(logger: Logger, orchestrator: AgentOrchestrator) {
    super(
      'PriorityManager',
      'Manages response priorities and resource allocation',
      logger,
      orchestrator
    );
    this.initializeResourcePool();
  }

  protected async initialize(): Promise<void> {
    this.logger.info(`${this.name} initializing priority management system...`);
    this.logActivity('Priority management system online');
  }

  private initializeResourcePool(): void {
    // Initialize with available resources
    this.resourcePool.set('fire_trucks', [
      { resourceType: 'fire_truck', quantity: 20, location: 'Station A', status: 'available' },
      { resourceType: 'fire_truck', quantity: 15, location: 'Station B', status: 'available' },
    ]);
    
    this.resourcePool.set('ambulances', [
      { resourceType: 'ambulance', quantity: 30, location: 'Hospital Central', status: 'available' },
      { resourceType: 'ambulance', quantity: 25, location: 'Medical Center', status: 'available' },
    ]);
    
    this.resourcePool.set('police_units', [
      { resourceType: 'police_unit', quantity: 40, location: 'HQ', status: 'available' },
      { resourceType: 'police_unit', quantity: 30, location: 'District 2', status: 'available' },
    ]);
    
    this.resourcePool.set('rescue_teams', [
      { resourceType: 'rescue_team', quantity: 10, location: 'Emergency Base', status: 'available' },
      { resourceType: 'rescue_team', quantity: 8, location: 'Regional Center', status: 'available' },
    ]);
  }

  protected async process(): Promise<void> {
    try {
      // Process priority queue
      this.processPriorityQueue();
      
      // Update resource allocations
      this.updateResourceStatus();
      
      // Review and rebalance priorities
      this.rebalancePriorities();
      
      // Process action queue
      this.processActionQueue();
      
      // Update status
      this.updateStatus({
        status: 'online',
        message: 'Managing priorities',
        metrics: {
          activeDisasters: this.disasterQueue.length,
          criticalPriorities: this.disasterQueue.filter(d => d.overallPriority === 1).length,
          deployedResources: this.getDeployedResourceCount(),
          pendingActions: this.actionQueue.filter(a => a.status === 'pending').length,
        },
      });
    } catch (error) {
      this.logger.error(`${this.name} processing error:`, error);
      this.updateStatus({
        status: 'warning',
        message: 'Priority management error',
      });
    }
  }

  protected handleMessage(message: AgentMessage): void {
    switch (message.type) {
      case 'new_threat_analysis':
        this.processThreatAnalysis(message.data);
        break;
        
      case 'impact_assessment':
        this.processImpactAssessment(message.data);
        break;
        
      case 'evacuation_routes':
        this.integrateEvacuationData(message.data);
        break;
        
      case 'resource_request':
        this.handleResourceRequest(message.data);
        break;
        
      case 'update_action_status':
        this.updateActionStatus(message.data);
        break;
        
      case 'request_priorities':
        this.providePriorities(message.from, message.data);
        break;
        
      default:
        this.logger.debug(`${this.name} received unhandled message type: ${message.type}`);
    }
  }

  private processThreatAnalysis(threatData: any): void {
    this.logger.info(`${this.name} processing threat analysis for ${threatData.threatId}`);
    
    // Calculate priority score
    const priorityScore = this.calculatePriorityScore(threatData);
    
    // Create disaster priority entry
    const disasterPriority: DisasterPriority = {
      disasterId: threatData.threatId,
      overallPriority: this.determinePriorityLevel(priorityScore),
      factors: {
        casualties: 0, // Will be updated with impact assessment
        displaced: 0,
        economicImpact: 0,
        infrastructureDamage: threatData.requiredActions?.length || 0,
        timeUntilImpact: this.estimateTimeUntilImpact(threatData),
      },
      score: priorityScore,
    };
    
    // Add to queue and sort
    this.disasterQueue.push(disasterPriority);
    this.disasterQueue.sort((a, b) => b.score - a.score);
    
    // Create response priority
    const responsePriority = this.createResponsePriority(threatData, disasterPriority);
    this.priorities.set(threatData.threatId, responsePriority);
    
    // Allocate initial resources
    this.allocateResources(responsePriority);
    
    // Send priority to action agents
    this.sendMessage('AlertDispatcher', 'priority_assignment', {
      disasterId: threatData.threatId,
      priority: disasterPriority.overallPriority,
      immediateActions: responsePriority.timeline.immediate,
    });
    
    this.logActivity('Priority assigned', {
      disasterId: threatData.threatId,
      priorityLevel: disasterPriority.overallPriority as 1 | 2 | 3 | 4 | 5,
      score: priorityScore,
    });
  }

  private calculatePriorityScore(threatData: any): number {
    let score = 0;
    
    // Threat level contribution (0-40 points)
    switch (threatData.threatLevel) {
      case 'critical': score += 40; break;
      case 'high': score += 30; break;
      case 'medium': score += 20; break;
      case 'low': score += 10; break;
    }
    
    // Population impact (0-30 points)
    const population = threatData.affectedArea?.estimatedPopulation || 0;
    if (population > 100000) score += 30;
    else if (population > 50000) score += 25;
    else if (population > 10000) score += 20;
    else if (population > 1000) score += 15;
    else if (population > 100) score += 10;
    else score += 5;
    
    // Time criticality (0-20 points)
    const timeUrgency = Math.random() * 20; // Simulated time urgency
    score += timeUrgency;
    
    // Confidence level adjustment (0-10 points)
    score += (threatData.confidence / 100) * 10;
    
    return Math.min(score, 100);
  }

  private determinePriorityLevel(score: number): 1 | 2 | 3 | 4 | 5 {
    if (score >= 80) return 1;
    if (score >= 60) return 2;
    if (score >= 40) return 3;
    if (score >= 20) return 4;
    return 5;
  }

  private estimateTimeUntilImpact(threatData: any): number {
    // Estimate hours until impact based on threat type
    if (threatData.threatLevel === 'critical') return 1;
    if (threatData.threatLevel === 'high') return 3;
    if (threatData.threatLevel === 'medium') return 6;
    return 12;
  }

  private createResponsePriority(threatData: any, disasterPriority: DisasterPriority): ResponsePriority {
    const actions = this.generatePrioritizedActions(threatData, disasterPriority);
    const resources = this.determineRequiredResources(threatData);
    
    return {
      priorityId: `priority_${Date.now()}`,
      disasterId: threatData.threatId,
      priorityLevel: disasterPriority.overallPriority as 1 | 2 | 3 | 4 | 5,
      category: this.determineCategory(threatData),
      actions: actions,
      resources: resources,
      timeline: this.createTimeline(actions),
      estimatedResolution: this.estimateResolutionTime(threatData),
    };
  }

  private generatePrioritizedActions(threatData: any, priority: DisasterPriority): PrioritizedAction[] {
    const actions: PrioritizedAction[] = [];
    const baseActions = threatData.requiredActions || [];
    
    // Add threat-specific actions
    for (let i = 0; i < baseActions.length; i++) {
      actions.push({
        actionId: `action_${Date.now()}_${i}`,
        description: baseActions[i],
        priority: i + 1,
        assignedTo: this.assignResponsibleAgent(baseActions[i]),
        status: 'pending',
        deadline: new Date(Date.now() + (i + 1) * 3600000), // Staggered deadlines
        dependencies: i > 0 ? [`action_${Date.now()}_${i - 1}`] : [],
      });
    }
    
    // Add standard emergency actions based on priority
    if (priority.overallPriority <= 2) {
      actions.push({
        actionId: `action_${Date.now()}_emergency`,
        description: 'Activate emergency response team',
        priority: 0,
        assignedTo: 'AlertDispatcher',
        status: 'pending',
        deadline: new Date(Date.now() + 600000), // 10 minutes
        dependencies: [],
      });
    }
    
    // Sort by priority
    actions.sort((a, b) => a.priority - b.priority);
    
    return actions;
  }

  private assignResponsibleAgent(action: string): string {
    // Assign actions to appropriate agents based on keywords
    const actionLower = action.toLowerCase();
    
    if (actionLower.includes('alert') || actionLower.includes('warn')) {
      return 'AlertDispatcher';
    }
    if (actionLower.includes('notify') || actionLower.includes('message')) {
      return 'NotificationManager';
    }
    if (actionLower.includes('status') || actionLower.includes('report')) {
      return 'StatusReporter';
    }
    if (actionLower.includes('evacuate') || actionLower.includes('route')) {
      return 'RouteCalculator';
    }
    
    return 'AlertDispatcher'; // Default
  }

  private determineRequiredResources(threatData: any): ResourceAllocation[] {
    const resources: ResourceAllocation[] = [];
    const threatLevel = threatData.threatLevel;
    
    // Determine resource needs based on threat level and type
    if (threatLevel === 'critical' || threatLevel === 'high') {
      resources.push({
        resourceType: 'ambulance',
        quantity: 10,
        location: 'staging_area',
        status: 'available',
      });
      resources.push({
        resourceType: 'rescue_team',
        quantity: 5,
        location: 'staging_area',
        status: 'available',
      });
    }
    
    if (threatData.type === 'fire') {
      resources.push({
        resourceType: 'fire_truck',
        quantity: threatLevel === 'critical' ? 15 : 8,
        location: 'fire_station',
        status: 'available',
      });
    }
    
    // Always include police for crowd control
    resources.push({
      resourceType: 'police_unit',
      quantity: threatLevel === 'critical' ? 20 : 10,
      location: 'police_hq',
      status: 'available',
    });
    
    return resources;
  }

  private determineCategory(threatData: any): ResponsePriority['category'] {
    if (threatData.threatLevel === 'critical' || threatData.affectedArea?.estimatedPopulation > 10000) {
      return 'life_safety';
    }
    if (threatData.requiredActions?.some((a: string) => a.includes('infrastructure'))) {
      return 'infrastructure';
    }
    if (threatData.type === 'fire' || threatData.type === 'flood') {
      return 'property_protection';
    }
    return 'environment';
  }

  private createTimeline(actions: PrioritizedAction[]): ResponsePriority['timeline'] {
    const timeline = {
      immediate: [] as string[],
      urgent: [] as string[],
      important: [] as string[],
      routine: [] as string[],
    };
    
    for (const action of actions) {
      const hoursUntilDeadline = (action.deadline.getTime() - Date.now()) / 3600000;
      
      if (hoursUntilDeadline <= 1) {
        timeline.immediate.push(action.description);
      } else if (hoursUntilDeadline <= 6) {
        timeline.urgent.push(action.description);
      } else if (hoursUntilDeadline <= 24) {
        timeline.important.push(action.description);
      } else {
        timeline.routine.push(action.description);
      }
    }
    
    return timeline;
  }

  private estimateResolutionTime(threatData: any): number {
    // Estimate hours to resolution based on threat type and level
    const baseTime = {
      'critical': 48,
      'high': 24,
      'medium': 12,
      'low': 6,
    };
    
    return baseTime[threatData.threatLevel as keyof typeof baseTime] || 24;
  }

  private processImpactAssessment(impactData: any): void {
    // Update disaster priority with impact data
    const disaster = this.disasterQueue.find(d => d.disasterId === impactData.disasterId);
    if (disaster) {
      disaster.factors.casualties = impactData.predictedImpact.casualties.max;
      disaster.factors.displaced = impactData.predictedImpact.displaced.max;
      disaster.factors.economicImpact = impactData.predictedImpact.economicLoss.max;
      
      // Recalculate priority based on new information
      disaster.score = this.recalculatePriorityScore(disaster);
      disaster.overallPriority = this.determinePriorityLevel(disaster.score);
      
      // Resort queue
      this.disasterQueue.sort((a, b) => b.score - a.score);
      
      this.logActivity('Priority updated with impact assessment', {
        disasterId: impactData.disasterId,
        newPriority: disaster.overallPriority,
      });
    }
  }

  private recalculatePriorityScore(disaster: DisasterPriority): number {
    let score = 50; // Base score
    
    // Casualties impact (0-30 points)
    if (disaster.factors.casualties > 100) score += 30;
    else if (disaster.factors.casualties > 50) score += 25;
    else if (disaster.factors.casualties > 10) score += 20;
    else if (disaster.factors.casualties > 1) score += 15;
    else score += 5;
    
    // Displaced population (0-20 points)
    if (disaster.factors.displaced > 10000) score += 20;
    else if (disaster.factors.displaced > 5000) score += 15;
    else if (disaster.factors.displaced > 1000) score += 10;
    else score += 5;
    
    // Economic impact (0-20 points)
    if (disaster.factors.economicImpact > 1000) score += 20;
    else if (disaster.factors.economicImpact > 500) score += 15;
    else if (disaster.factors.economicImpact > 100) score += 10;
    else score += 5;
    
    // Time criticality (0-30 points)
    const timeBonus = Math.max(30 - disaster.factors.timeUntilImpact * 2, 0);
    score += timeBonus;
    
    return Math.min(score, 100);
  }

  private integrateEvacuationData(evacuationData: any): void {
    const priority = this.priorities.get(evacuationData.disasterId);
    if (priority) {
      // Add evacuation routes to immediate actions
      priority.timeline.immediate.push(`Evacuate via ${evacuationData.routes[0]?.destination}`);
      
      // Update resource needs for evacuation
      priority.resources.push({
        resourceType: 'evacuation_bus',
        quantity: Math.ceil(evacuationData.routes[0]?.capacity / 50),
        location: 'transport_depot',
        status: 'available',
      });
      
      this.logActivity('Evacuation data integrated', {
        disasterId: evacuationData.disasterId,
        primaryRoute: evacuationData.routes[0]?.destination,
      });
    }
  }

  private allocateResources(priority: ResponsePriority): void {
    for (const required of priority.resources) {
      const available = this.resourcePool.get(required.resourceType);
      if (available) {
        for (const resource of available) {
          if (resource.status === 'available' && resource.quantity >= required.quantity) {
            // Allocate resource
            resource.status = 'deployed';
            resource.estimatedArrival = 15 + Math.floor(Math.random() * 45);
            required.status = 'en_route';
            required.estimatedArrival = resource.estimatedArrival;
            
            this.logActivity('Resource allocated', {
              type: required.resourceType,
              quantity: required.quantity,
              disasterId: priority.disasterId,
            });
            break;
          }
        }
      }
    }
  }

  private processPriorityQueue(): void {
    // Process top priority disasters
    for (const disaster of this.disasterQueue.slice(0, 3)) {
      const priority = this.priorities.get(disaster.disasterId);
      if (priority) {
        // Process immediate actions
        for (const action of priority.actions) {
          if (action.status === 'pending' && action.priority <= 3) {
            this.initiateAction(action, priority);
          }
        }
      }
    }
  }

  private initiateAction(action: PrioritizedAction, priority: ResponsePriority): void {
    action.status = 'in_progress';
    this.actionQueue.push(action);
    
    // Send action to assigned agent
    this.sendMessage(action.assignedTo, 'execute_action', {
      action: action,
      disasterId: priority.disasterId,
      priority: priority.priorityLevel,
    });
    
    this.logActivity('Action initiated', {
      actionId: action.actionId,
      description: action.description,
      assignedTo: action.assignedTo,
    });
  }

  private processActionQueue(): void {
    // Review action queue and update statuses
    const now = Date.now();
    
    for (const action of this.actionQueue) {
      if (action.status === 'in_progress') {
        // Check if action should be completed (simulated)
        if (Math.random() > 0.9) {
          action.status = 'completed';
          this.logActivity('Action completed', { actionId: action.actionId });
        } else if (action.deadline.getTime() < now) {
          // Action is overdue
          this.logActivity('Action overdue', { actionId: action.actionId });
        }
      }
    }
    
    // Clean up completed actions
    this.actionQueue = this.actionQueue.filter(a => a.status !== 'completed');
  }

  private updateResourceStatus(): void {
    // Update resource availability and status
    for (const [type, resources] of this.resourcePool) {
      for (const resource of resources) {
        if (resource.status === 'en_route' && resource.estimatedArrival) {
          resource.estimatedArrival--;
          if (resource.estimatedArrival <= 0) {
            resource.status = 'deployed';
          }
        } else if (resource.status === 'deployed') {
          // Random chance to become available again
          if (Math.random() > 0.95) {
            resource.status = 'available';
            resource.estimatedArrival = undefined;
          }
        }
      }
    }
  }

  private rebalancePriorities(): void {
    // Periodically review and rebalance priorities
    if (this.disasterQueue.length > 1) {
      // Check if priorities need adjustment based on time
      for (const disaster of this.disasterQueue) {
        disaster.factors.timeUntilImpact = Math.max(disaster.factors.timeUntilImpact - 0.1, 0);
        disaster.score = this.recalculatePriorityScore(disaster);
      }
      
      // Resort
      this.disasterQueue.sort((a, b) => b.score - a.score);
    }
  }

  private handleResourceRequest(data: any): void {
    const { resourceType, quantity, disasterId } = data;
    const available = this.resourcePool.get(resourceType);
    
    if (available) {
      const resource = available.find(r => r.status === 'available' && r.quantity >= quantity);
      if (resource) {
        this.sendMessage(data.requester, 'resource_allocated', {
          resourceType,
          quantity,
          estimatedArrival: 15 + Math.floor(Math.random() * 30),
        });
      }
    }
  }

  private updateActionStatus(data: any): void {
    const action = this.actionQueue.find(a => a.actionId === data.actionId);
    if (action) {
      action.status = data.status;
      this.logActivity('Action status updated', {
        actionId: data.actionId,
        status: data.status,
      });
    }
  }

  private providePriorities(requester: string, data: any): void {
    const priorities = data.disasterId 
      ? this.priorities.get(data.disasterId)
      : Array.from(this.priorities.values());
    
    this.sendMessage(requester, 'priorities_response', priorities);
  }

  private getDeployedResourceCount(): number {
    let count = 0;
    for (const [type, resources] of this.resourcePool) {
      count += resources.filter(r => r.status === 'deployed').length;
    }
    return count;
  }

  protected cleanup(): void {
    this.priorities.clear();
    this.disasterQueue = [];
    this.actionQueue = [];
    // Reset resource pool
    for (const [type, resources] of this.resourcePool) {
      for (const resource of resources) {
        resource.status = 'available';
        resource.estimatedArrival = undefined;
      }
    }
  }

  protected getProcessingInterval(): number {
    return 20000; // Process every 20 seconds
  }
}