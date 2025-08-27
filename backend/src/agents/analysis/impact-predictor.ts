import { BaseAgent } from '../base-agent';
import { Logger } from 'winston';
import { AgentOrchestrator, AgentMessage, DisasterEvent } from '../orchestrator';

interface ImpactPrediction {
  disasterId: string;
  predictedImpact: {
    casualties: { min: number; max: number };
    displaced: { min: number; max: number };
    economicLoss: { min: number; max: number }; // in millions USD
    infrastructureDamage: string[]; // List of affected infrastructure
    duration: number; // hours until recovery
  };
  affectedServices: string[];
  criticalInfrastructure: {
    hospitals: number;
    schools: number;
    powerPlants: number;
    waterFacilities: number;
  };
  confidenceLevel: number;
  recommendations: string[];
}

export class ImpactPredictorAgent extends BaseAgent {
  private predictions: Map<string, ImpactPrediction> = new Map();
  private historicalData: ImpactPrediction[] = [];

  constructor(logger: Logger, orchestrator: AgentOrchestrator) {
    super(
      'ImpactPredictor',
      'Predicts the potential impact of disasters',
      logger,
      orchestrator
    );
  }

  protected async initialize(): Promise<void> {
    this.logger.info(`${this.name} initializing impact prediction models...`);
    this.logActivity('Impact prediction system online');
  }

  protected async process(): Promise<void> {
    try {
      // Review and update predictions based on new data
      this.updatePredictions();
      
      // Update status
      this.updateStatus({
        status: 'online',
        message: 'Predicting impacts',
        metrics: {
          activePredictions: this.predictions.size,
          highImpactEvents: Array.from(this.predictions.values())
            .filter(p => p.predictedImpact.casualties.max > 100).length,
        },
      });
    } catch (error) {
      this.logger.error(`${this.name} processing error:`, error);
      this.updateStatus({
        status: 'warning',
        message: 'Prediction error',
      });
    }
  }

  protected handleMessage(message: AgentMessage): void {
    switch (message.type) {
      case 'predict_impact':
        this.predictDisasterImpact(message.data);
        break;
        
      case 'threat_analysis':
        this.enhancePredictionWithThreatData(message.data);
        break;
        
      case 'update_prediction':
        this.updatePrediction(message.data);
        break;
        
      case 'request_prediction':
        this.providePrediction(message.from, message.data);
        break;
        
      default:
        this.logger.debug(`${this.name} received unhandled message type: ${message.type}`);
    }
  }

  private predictDisasterImpact(event: DisasterEvent): void {
    this.logger.info(`${this.name} predicting impact for ${event.type} disaster`);
    
    const prediction: ImpactPrediction = {
      disasterId: event.id,
      predictedImpact: this.calculateImpact(event),
      affectedServices: this.predictAffectedServices(event),
      criticalInfrastructure: this.assessCriticalInfrastructure(event),
      confidenceLevel: this.calculatePredictionConfidence(event),
      recommendations: this.generateRecommendations(event),
    };

    // Store prediction
    this.predictions.set(event.id, prediction);
    this.historicalData.push(prediction);

    // Send to route calculator for evacuation planning
    this.sendMessage('RouteCalculator', 'impact_prediction', {
      disasterId: event.id,
      affectedArea: event.location,
      estimatedDisplaced: prediction.predictedImpact.displaced.max,
    });

    // Send to priority manager
    this.sendMessage('PriorityManager', 'impact_assessment', prediction);

    // Emit analysis complete with impact data
    this.emit('analysis_complete', {
      ...prediction,
      requiresAlert: prediction.predictedImpact.casualties.max > 10,
      requiresNotification: true,
    });

    this.logActivity('Impact prediction complete', {
      disasterId: event.id,
      maxCasualties: prediction.predictedImpact.casualties.max,
      confidence: prediction.confidenceLevel,
    });
  }

  private calculateImpact(event: DisasterEvent): ImpactPrediction['predictedImpact'] {
    let casualties = { min: 0, max: 0 };
    let displaced = { min: 0, max: 0 };
    let economicLoss = { min: 0, max: 0 };
    let infrastructureDamage: string[] = [];
    let duration = 24; // Default 24 hours

    // Base calculations on disaster type
    switch (event.type) {
      case 'earthquake':
        const magnitude = event.data.magnitude || 5;
        if (magnitude > 7) {
          casualties = { min: 100, max: 1000 };
          displaced = { min: 5000, max: 50000 };
          economicLoss = { min: 100, max: 1000 };
          infrastructureDamage = ['buildings', 'roads', 'bridges', 'utilities'];
          duration = 168; // 1 week
        } else if (magnitude > 6) {
          casualties = { min: 10, max: 100 };
          displaced = { min: 1000, max: 10000 };
          economicLoss = { min: 10, max: 100 };
          infrastructureDamage = ['buildings', 'roads'];
          duration = 72;
        } else if (magnitude > 5) {
          casualties = { min: 0, max: 10 };
          displaced = { min: 100, max: 1000 };
          economicLoss = { min: 1, max: 10 };
          infrastructureDamage = ['minor building damage'];
          duration = 24;
        }
        break;

      case 'fire':
        const firePower = event.data.firePower || 20;
        if (firePower > 40) {
          casualties = { min: 5, max: 50 };
          displaced = { min: 1000, max: 10000 };
          economicLoss = { min: 50, max: 500 };
          infrastructureDamage = ['buildings', 'forests', 'power lines'];
          duration = 96;
        } else if (firePower > 25) {
          casualties = { min: 0, max: 10 };
          displaced = { min: 100, max: 1000 };
          economicLoss = { min: 5, max: 50 };
          infrastructureDamage = ['buildings', 'vegetation'];
          duration = 48;
        } else {
          casualties = { min: 0, max: 2 };
          displaced = { min: 10, max: 100 };
          economicLoss = { min: 0.5, max: 5 };
          infrastructureDamage = ['vegetation'];
          duration = 24;
        }
        break;

      case 'weather':
        const category = event.data.category || 1;
        if (category >= 4) {
          casualties = { min: 50, max: 500 };
          displaced = { min: 10000, max: 100000 };
          economicLoss = { min: 500, max: 5000 };
          infrastructureDamage = ['buildings', 'power grid', 'roads', 'coastal areas'];
          duration = 240; // 10 days
        } else if (category >= 3) {
          casualties = { min: 10, max: 100 };
          displaced = { min: 5000, max: 50000 };
          economicLoss = { min: 100, max: 1000 };
          infrastructureDamage = ['buildings', 'power lines', 'trees'];
          duration = 120;
        } else {
          casualties = { min: 0, max: 10 };
          displaced = { min: 100, max: 5000 };
          economicLoss = { min: 10, max: 100 };
          infrastructureDamage = ['power lines', 'trees'];
          duration = 48;
        }
        break;

      case 'flood':
        const waterLevel = event.data.waterLevel || 2;
        if (waterLevel > 5) {
          casualties = { min: 10, max: 100 };
          displaced = { min: 5000, max: 50000 };
          economicLoss = { min: 100, max: 1000 };
          infrastructureDamage = ['buildings', 'roads', 'agriculture', 'water systems'];
          duration = 168;
        } else if (waterLevel > 3) {
          casualties = { min: 0, max: 10 };
          displaced = { min: 1000, max: 10000 };
          economicLoss = { min: 10, max: 100 };
          infrastructureDamage = ['roads', 'basements', 'agriculture'];
          duration = 72;
        } else {
          casualties = { min: 0, max: 2 };
          displaced = { min: 50, max: 500 };
          economicLoss = { min: 1, max: 10 };
          infrastructureDamage = ['basements', 'roads'];
          duration = 24;
        }
        break;
    }

    // Adjust based on severity
    if (event.severity === 'critical') {
      casualties.max *= 2;
      displaced.max *= 2;
      economicLoss.max *= 2;
    }

    return {
      casualties,
      displaced,
      economicLoss,
      infrastructureDamage,
      duration,
    };
  }

  private predictAffectedServices(event: DisasterEvent): string[] {
    const services: string[] = [];
    
    switch (event.type) {
      case 'earthquake':
        services.push('electricity', 'water', 'gas', 'telecommunications', 'transportation');
        break;
      case 'fire':
        services.push('electricity', 'telecommunications', 'transportation', 'air quality');
        break;
      case 'weather':
        services.push('electricity', 'transportation', 'telecommunications', 'emergency services');
        break;
      case 'flood':
        services.push('transportation', 'water', 'sewage', 'electricity');
        break;
    }

    return services;
  }

  private assessCriticalInfrastructure(event: DisasterEvent): ImpactPrediction['criticalInfrastructure'] {
    // Simulate infrastructure in affected area
    const baseInfrastructure = {
      hospitals: Math.floor(Math.random() * 5) + 1,
      schools: Math.floor(Math.random() * 20) + 5,
      powerPlants: Math.floor(Math.random() * 3),
      waterFacilities: Math.floor(Math.random() * 4) + 1,
    };

    // Adjust based on severity and type
    if (event.severity === 'critical') {
      baseInfrastructure.hospitals *= 2;
      baseInfrastructure.schools *= 3;
    }

    return baseInfrastructure;
  }

  private calculatePredictionConfidence(event: DisasterEvent): number {
    let confidence = 60; // Base confidence
    
    // Increase confidence based on data quality
    if (event.data && Object.keys(event.data).length > 3) confidence += 15;
    if (event.location && event.location.radius) confidence += 10;
    if (event.severity) confidence += 10;
    
    // Decrease confidence for future predictions
    if (event.data.isSimulation) confidence -= 20;
    
    return Math.min(Math.max(confidence, 20), 95);
  }

  private generateRecommendations(event: DisasterEvent): string[] {
    const recommendations: string[] = [];
    
    // General recommendations
    recommendations.push('Activate emergency response teams');
    recommendations.push('Establish communication channels');
    
    // Type-specific recommendations
    switch (event.type) {
      case 'earthquake':
        recommendations.push('Deploy search and rescue teams');
        recommendations.push('Inspect critical infrastructure for damage');
        recommendations.push('Prepare for aftershocks');
        recommendations.push('Setup emergency medical facilities');
        break;
        
      case 'fire':
        recommendations.push('Establish evacuation zones');
        recommendations.push('Deploy firefighting aircraft');
        recommendations.push('Create firebreaks');
        recommendations.push('Monitor air quality');
        break;
        
      case 'weather':
        recommendations.push('Issue evacuation orders for coastal areas');
        recommendations.push('Secure emergency shelters');
        recommendations.push('Pre-position emergency supplies');
        recommendations.push('Clear storm drains');
        break;
        
      case 'flood':
        recommendations.push('Deploy sandbags to critical areas');
        recommendations.push('Evacuate low-lying areas');
        recommendations.push('Prepare water pumps');
        recommendations.push('Monitor dam integrity');
        break;
    }
    
    // Add severity-based recommendations
    if (event.severity === 'critical' || event.severity === 'high') {
      recommendations.push('Request federal/state assistance');
      recommendations.push('Activate mutual aid agreements');
      recommendations.push('Declare state of emergency');
    }
    
    return recommendations;
  }

  private enhancePredictionWithThreatData(threatData: any): void {
    const prediction = this.predictions.get(threatData.threatId);
    if (prediction) {
      // Enhance prediction with threat analysis data
      if (threatData.affectedArea?.estimatedPopulation) {
        const popFactor = threatData.affectedArea.estimatedPopulation / 10000;
        prediction.predictedImpact.casualties.max *= (1 + popFactor * 0.1);
        prediction.predictedImpact.displaced.max *= (1 + popFactor * 0.2);
      }
      
      this.logActivity('Prediction enhanced with threat data', {
        disasterId: threatData.threatId,
      });
    }
  }

  private updatePrediction(data: any): void {
    const prediction = this.predictions.get(data.disasterId);
    if (prediction) {
      Object.assign(prediction, data.updates);
      this.logActivity('Prediction updated', { disasterId: data.disasterId });
    }
  }

  private updatePredictions(): void {
    // Simulate updating predictions based on new information
    for (const [id, prediction] of this.predictions) {
      // Random chance to update confidence
      if (Math.random() > 0.9) {
        prediction.confidenceLevel = Math.min(prediction.confidenceLevel + 5, 95);
      }
      
      // Remove old predictions (older than 24 hours in real scenario)
      if (Math.random() > 0.99) {
        this.predictions.delete(id);
        this.logActivity('Old prediction removed', { disasterId: id });
      }
    }
  }

  private providePrediction(requester: string, data: any): void {
    const prediction = this.predictions.get(data.disasterId);
    if (prediction) {
      this.sendMessage(requester, 'prediction_response', prediction);
    }
  }

  protected cleanup(): void {
    this.predictions.clear();
    this.historicalData = [];
  }

  protected getProcessingInterval(): number {
    return 60000; // Process every minute
  }
}