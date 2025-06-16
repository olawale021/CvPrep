"use client";

import {
    AlertTriangle,
    ArrowLeft,
    CheckCircle,
    Clock,
    Globe,
    RefreshCw,
    Server,
    Shield,
    Zap
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "../../../components/ui/base/Button";
import { Card, CardContent } from "../../../components/ui/base/Card";
import Sidebar from "../../../components/layout/Sidebar";

const services = [
  {
    name: "Resume Optimizer",
    description: "AI-powered resume analysis and optimization",
    status: "operational",
    uptime: "99.9%",
    responseTime: "1.2s",
    icon: <Zap className="h-5 w-5" />
  },
  {
    name: "Interview Prep",
    description: "AI interview question generation and practice",
    status: "operational",
    uptime: "99.8%",
    responseTime: "0.8s",
    icon: <Server className="h-5 w-5" />
  },
  {
    name: "Cover Letter Generator",
    description: "Personalized cover letter creation",
    status: "operational",
    uptime: "99.9%",
    responseTime: "1.1s",
    icon: <Globe className="h-5 w-5" />
  },
  {
    name: "File Upload Service",
    description: "Resume and document upload processing",
    status: "operational",
    uptime: "99.7%",
    responseTime: "2.1s",
    icon: <Server className="h-5 w-5" />
  },
  {
    name: "Authentication",
    description: "User login and account management",
    status: "operational",
    uptime: "99.9%",
    responseTime: "0.5s",
    icon: <Shield className="h-5 w-5" />
  },
  {
    name: "Database",
    description: "Data storage and retrieval",
    status: "operational",
    uptime: "99.9%",
    responseTime: "0.3s",
    icon: <Server className="h-5 w-5" />
  }
];

const incidents = [
  {
    id: "INC-2024-001",
    title: "Intermittent Resume Upload Delays",
    description: "Some users experienced slower than normal resume upload times due to increased traffic.",
    status: "resolved",
    severity: "minor",
    startTime: "2024-01-20 14:30 UTC",
    endTime: "2024-01-20 15:45 UTC",
    duration: "1h 15m",
    affectedServices: ["File Upload Service"]
  },
  {
    id: "INC-2024-002",
    title: "Scheduled Maintenance - Database Optimization",
    description: "Planned maintenance to optimize database performance and improve response times.",
    status: "completed",
    severity: "maintenance",
    startTime: "2024-01-18 02:00 UTC",
    endTime: "2024-01-18 04:00 UTC",
    duration: "2h 0m",
    affectedServices: ["All Services"]
  },
  {
    id: "INC-2024-003",
    title: "AI Service Temporary Slowdown",
    description: "Resume optimization and interview prep services experienced temporary performance degradation.",
    status: "resolved",
    severity: "minor",
    startTime: "2024-01-15 09:15 UTC",
    endTime: "2024-01-15 10:30 UTC",
    duration: "1h 15m",
    affectedServices: ["Resume Optimizer", "Interview Prep"]
  }
];

const statusColors = {
  operational: "text-green-600 bg-green-100",
  degraded: "text-yellow-600 bg-yellow-100",
  outage: "text-red-600 bg-red-100",
  maintenance: "text-blue-600 bg-blue-100"
};

const statusIcons = {
  operational: <CheckCircle className="h-4 w-4" />,
  degraded: <AlertTriangle className="h-4 w-4" />,
  outage: <AlertTriangle className="h-4 w-4" />,
  maintenance: <Clock className="h-4 w-4" />
};

const severityColors = {
  minor: "bg-yellow-100 text-yellow-800",
  major: "bg-orange-100 text-orange-800",
  critical: "bg-red-100 text-red-800",
  maintenance: "bg-blue-100 text-blue-800"
};

export default function SystemStatus() {
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const handleRefresh = () => {
    setLastUpdated(new Date());
  };

  const overallStatus = services.every(service => service.status === "operational") 
    ? "operational" 
    : services.some(service => service.status === "outage")
    ? "outage"
    : "degraded";

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-4 md:p-6 pt-16 md:pt-6 overflow-x-hidden">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <Link href="/help" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Help Center
            </Link>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">System Status</h1>
                <p className="text-lg text-gray-600">
                  Real-time status of CareerPal services and infrastructure
                </p>
              </div>
              <Button onClick={handleRefresh} variant="outline" className="flex items-center">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Overall Status */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`p-2 rounded-full mr-4 ${statusColors[overallStatus as keyof typeof statusColors]}`}>
                    {statusIcons[overallStatus as keyof typeof statusIcons]}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {overallStatus === "operational" ? "All Systems Operational" :
                       overallStatus === "degraded" ? "Some Systems Degraded" :
                       "System Outage"}
                    </h2>
                    <p className="text-sm text-gray-600">
                      Last updated: {lastUpdated.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">99.8%</div>
                  <div className="text-sm text-gray-500">30-day uptime</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Services Status */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Service Status</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {services.map((service, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center">
                        <div className="p-2 bg-gray-100 rounded-lg mr-3">
                          {service.icon}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{service.name}</h3>
                          <p className="text-sm text-gray-600">{service.description}</p>
                        </div>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center ${statusColors[service.status as keyof typeof statusColors]}`}>
                        {statusIcons[service.status as keyof typeof statusIcons]}
                        <span className="ml-1 capitalize">{service.status}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Uptime:</span>
                        <span className="font-medium text-gray-900 ml-1">{service.uptime}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Response:</span>
                        <span className="font-medium text-gray-900 ml-1">{service.responseTime}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Recent Incidents */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Recent Incidents</h2>
            <div className="space-y-4">
              {incidents.map((incident) => (
                <Card key={incident.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <h3 className="font-semibold text-gray-900 mr-3">{incident.title}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${severityColors[incident.severity as keyof typeof severityColors]}`}>
                            {incident.severity}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ml-2 ${
                            incident.status === 'resolved' || incident.status === 'completed' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {incident.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{incident.description}</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Started:</span>
                            <span className="font-medium text-gray-900 ml-1">{incident.startTime}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Duration:</span>
                            <span className="font-medium text-gray-900 ml-1">{incident.duration}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Affected:</span>
                            <span className="font-medium text-gray-900 ml-1">
                              {incident.affectedServices.join(", ")}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Performance Metrics</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">99.8%</div>
                  <div className="text-sm text-gray-600">30-Day Uptime</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">1.1s</div>
                  <div className="text-sm text-gray-600">Avg Response Time</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-2">3</div>
                  <div className="text-sm text-gray-600">Incidents This Month</div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Subscribe to Updates */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-8 text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Stay Updated
              </h3>
              <p className="text-gray-600 mb-4">
                Get notified about service updates and maintenance windows.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button className="w-full sm:w-auto">
                  Subscribe to Updates
                </Button>
                <Button variant="outline" className="w-full sm:w-auto">
                  RSS Feed
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
} 