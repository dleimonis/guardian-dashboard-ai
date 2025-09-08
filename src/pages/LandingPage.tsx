import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  AlertTriangle, 
  Map, 
  Bell, 
  Activity,
  Users,
  Zap,
  Globe,
  ChevronRight,
  PlayCircle,
  CheckCircle,
  Smartphone,
  Monitor,
  Wifi,
  BarChart3,
  Clock,
  Navigation
} from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  const features = [
    {
      icon: <Globe className="h-6 w-6" />,
      title: "Real-Time Global Monitoring",
      description: "24/7 surveillance of disasters worldwide using satellite data and official sources",
      highlight: "12+ AI Agents"
    },
    {
      icon: <Map className="h-6 w-6" />,
      title: "Interactive Disaster Map",
      description: "Live visualization of earthquakes, fires, floods, and severe weather events",
      highlight: "Live Updates"
    },
    {
      icon: <Bell className="h-6 w-6" />,
      title: "Multi-Channel Alerts",
      description: "Instant notifications via browser, mobile push, SMS, and email",
      highlight: "< 30 sec"
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Emergency Simulation",
      description: "Test the system with realistic disaster scenarios including MEGA DISASTER mode",
      highlight: "Demo Mode"
    }
  ];

  const stats = [
    { label: "Active Monitoring", value: "24/7", icon: <Clock className="h-4 w-4" /> },
    { label: "Response Time", value: "< 30s", icon: <Activity className="h-4 w-4" /> },
    { label: "Coverage", value: "Global", icon: <Globe className="h-4 w-4" /> },
    { label: "Alert Channels", value: "4+", icon: <Wifi className="h-4 w-4" /> }
  ];

  const workflowSteps = [
    {
      step: "1",
      title: "Detection",
      description: "AI agents continuously monitor NASA, USGS, NOAA, and other sources",
      icon: <Activity className="h-5 w-5" />
    },
    {
      step: "2",
      title: "Analysis",
      description: "Threat assessment, impact prediction, and route calculation",
      icon: <BarChart3 className="h-5 w-5" />
    },
    {
      step: "3",
      title: "Action",
      description: "Instant alerts dispatched through multiple channels",
      icon: <Bell className="h-5 w-5" />
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="container mx-auto px-4 py-16 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <Badge className="mb-4 px-4 py-1" variant="secondary">
              <Shield className="h-3 w-3 mr-1" />
              Emergency Management System
            </Badge>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
              Guardian Dashboard
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground mb-8">
              Multi-agent system monitoring disasters 24/7 to save lives with real-time alerts
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button 
                size="lg" 
                onClick={onGetStarted}
                className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white"
              >
                <Shield className="mr-2 h-5 w-5" />
                Get Started
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
              
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => {
                  const demoSection = document.getElementById('how-it-works');
                  demoSection?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <PlayCircle className="mr-2 h-5 w-5" />
                Watch Demo
              </Button>
            </div>

            {/* Live Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
              {stats.map((stat, index) => (
                <div key={index} className="bg-card/50 backdrop-blur-sm rounded-lg p-3 border">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground mb-1">
                    {stat.icon}
                    <span className="text-xs">{stat.label}</span>
                  </div>
                  <div className="text-2xl font-bold">{stat.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Animated Background Elements */}
        <div className="absolute top-20 left-10 animate-pulse">
          <AlertTriangle className="h-8 w-8 text-yellow-500/20" />
        </div>
        <div className="absolute bottom-20 right-10 animate-pulse delay-150">
          <Shield className="h-10 w-10 text-blue-500/20" />
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Powerful Features for Emergency Response
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Advanced technology working together to detect, analyze, and respond to disasters in real-time
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className="mb-4 p-3 bg-primary/10 rounded-lg w-fit group-hover:bg-primary/20 transition-colors">
                  {feature.icon}
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
                <Badge variant="secondary" className="mt-2 w-fit">
                  {feature.highlight}
                </Badge>
              </CardHeader>
              <CardContent>
                <CardDescription>{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* How It Works Section */}
      <div id="how-it-works" className="bg-secondary/30 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              How Guardian Dashboard Works
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Three-stage pipeline ensures rapid detection and response to emergencies
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="relative">
              {/* Connection Line */}
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-red-500 to-orange-500 hidden md:block"></div>
              
              {workflowSteps.map((step, index) => (
                <div key={index} className="relative flex items-start mb-8 last:mb-0">
                  {/* Step Number */}
                  <div className="flex-shrink-0 w-16 h-16 rounded-full bg-gradient-to-r from-red-500 to-orange-500 flex items-center justify-center text-white font-bold text-xl mr-6 z-10">
                    {step.step}
                  </div>
                  
                  {/* Content */}
                  <Card className="flex-1">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3">
                        {step.icon}
                        {step.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">{step.description}</p>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Multi-Platform Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Available Everywhere You Need It
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Access Guardian Dashboard from any device, receive alerts wherever you are
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-3xl mx-auto">
          <Card className="text-center">
            <CardHeader>
              <Monitor className="h-12 w-12 mx-auto mb-4 text-primary" />
              <CardTitle>Desktop</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Full dashboard with interactive map and real-time monitoring
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Smartphone className="h-12 w-12 mx-auto mb-4 text-primary" />
              <CardTitle>Mobile</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Push notifications and mobile-optimized interface
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Bell className="h-12 w-12 mx-auto mb-4 text-primary" />
              <CardTitle>Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                SMS, Email, and browser notifications for critical alerts
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Stay Safe?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of users who trust Guardian Dashboard for real-time disaster alerts
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={onGetStarted}
              className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white"
            >
              <Shield className="mr-2 h-5 w-5" />
              Start Monitoring Now
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          </div>

          <div className="mt-8 flex items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Free to use</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Real-time alerts</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;