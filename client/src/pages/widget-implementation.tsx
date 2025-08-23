import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Copy, 
  Check, 
  Settings, 
  Eye,
  Code,
  Palette,
  Globe,
  Shield,
  Package,
  BarChart3
} from 'lucide-react';
import { useAuth } from '@/lib/auth';

// Mock widget data
const mockWidget = {
  id: '1',
  name: 'Restaurant POS System',
  description: 'A comprehensive point-of-sale system for restaurants with order management, payment processing, and inventory tracking.',
  builder: 'John Doe',
  price: 400,
  rating: 4.8,
  category: 'Business',
  version: '1.2.0',
  lastUpdated: '2024-12-15T10:30:00Z',
  features: [
    'Order Management',
    'Payment Processing',
    'Inventory Tracking',
    'Customer Management',
    'Reporting & Analytics',
  ],
  configuration: {
    theme: 'light',
    language: 'en',
    currency: 'USD',
    timezone: 'UTC',
    notifications: true,
    analytics: true,
  },
  embedCode: `<script src="https://widgets.builderai.com/pos-system.js"></script>
<script>
  BuilderAI.init({
    widgetId: 'pos-system-123',
    theme: 'light',
    language: 'en',
    currency: 'USD',
    timezone: 'UTC',
    notifications: true,
    analytics: true
  });
</script>`,
};

const WidgetImplementation: React.FC = () => {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [configuration, setConfiguration] = useState(mockWidget.configuration);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100);
  };

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(mockWidget.embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConfigurationChange = (key: string, value: any) => {
    setConfiguration(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Widget Implementation</h1>
          <p className="text-muted-foreground">
            Configure and implement {mockWidget.name} on your website.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
          <Button>
            <Settings className="w-4 h-4 mr-2" />
            Save Configuration
          </Button>
        </div>
      </div>

      {/* Widget Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{mockWidget.name}</CardTitle>
              <CardDescription>{mockWidget.description}</CardDescription>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{formatCurrency(mockWidget.price)}/month</div>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex items-center gap-1">
                  <span className="text-yellow-400">★</span>
                  <span className="text-sm">{mockWidget.rating}</span>
                </div>
                <Badge variant="outline">{mockWidget.category}</Badge>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium">Builder:</span> {mockWidget.builder}
            </div>
            <div>
              <span className="font-medium">Version:</span> {mockWidget.version}
            </div>
            <div>
              <span className="font-medium">Last Updated:</span> {new Date(mockWidget.lastUpdated).toLocaleDateString()}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="configuration" className="space-y-4">
        <TabsList>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
          <TabsTrigger value="embed">Embed Code</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="configuration" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Basic Settings
                </CardTitle>
                <CardDescription>Configure the basic appearance and behavior</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="theme">Theme</Label>
                  <select
                    id="theme"
                    value={configuration.theme}
                    onChange={(e) => handleConfigurationChange('theme', e.target.value)}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="auto">Auto</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <select
                    id="language"
                    value={configuration.language}
                    onChange={(e) => handleConfigurationChange('language', e.target.value)}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <select
                    id="currency"
                    value={configuration.currency}
                    onChange={(e) => handleConfigurationChange('currency', e.target.value)}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="JPY">JPY (¥)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <select
                    id="timezone"
                    value={configuration.timezone}
                    onChange={(e) => handleConfigurationChange('timezone', e.target.value)}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">Eastern Time</option>
                    <option value="America/Chicago">Central Time</option>
                    <option value="America/Denver">Mountain Time</option>
                    <option value="America/Los_Angeles">Pacific Time</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Advanced Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Advanced Settings
                </CardTitle>
                <CardDescription>Configure advanced features and integrations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="notifications">Enable Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Show real-time notifications for orders and updates
                    </p>
                  </div>
                  <input
                    id="notifications"
                    type="checkbox"
                    checked={configuration.notifications}
                    onChange={(e) => handleConfigurationChange('notifications', e.target.checked)}
                    className="w-4 h-4"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="analytics">Enable Analytics</Label>
                    <p className="text-sm text-muted-foreground">
                      Track usage and performance metrics
                    </p>
                  </div>
                  <input
                    id="analytics"
                    type="checkbox"
                    checked={configuration.analytics}
                    onChange={(e) => handleConfigurationChange('analytics', e.target.checked)}
                    className="w-4 h-4"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customCss">Custom CSS</Label>
                  <Textarea
                    id="customCss"
                    placeholder="Add custom CSS to style the widget..."
                    className="min-h-[100px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="apiKey">API Key (Optional)</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    placeholder="Enter your API key for advanced features"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="embed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="w-5 h-5" />
                Embed Code
              </CardTitle>
              <CardDescription>
                Copy and paste this code into your website to implement the widget
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Implementation Code</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyCode}
                    className="flex items-center gap-2"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy Code
                      </>
                    )}
                  </Button>
                </div>
                <div className="bg-gray-900 text-green-400 p-4 rounded-md font-mono text-sm overflow-x-auto">
                  <pre>{mockWidget.embedCode}</pre>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Implementation Instructions:</h4>
                  <ol className="text-sm text-blue-800 space-y-1">
                    <li>1. Copy the embed code above</li>
                    <li>2. Paste it into your website's HTML, preferably in the &lt;head&gt; section</li>
                    <li>3. The widget will automatically load and display on your page</li>
                    <li>4. You can customize the configuration by modifying the parameters in the init function</li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Widget Preview
              </CardTitle>
              <CardDescription>
                See how the widget will look on your website
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg p-6 bg-gray-50 min-h-[400px]">
                <div className="text-center text-gray-500">
                  <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium mb-2">Widget Preview</h3>
                  <p className="text-sm">
                    The {mockWidget.name} widget will appear here when implemented on your website.
                  </p>
                  <div className="mt-4 p-4 bg-white rounded border">
                    <div className="text-sm text-gray-600">
                      <strong>Current Configuration:</strong>
                      <ul className="mt-2 space-y-1">
                        <li>• Theme: {configuration.theme}</li>
                        <li>• Language: {configuration.language}</li>
                        <li>• Currency: {configuration.currency}</li>
                        <li>• Notifications: {configuration.notifications ? 'Enabled' : 'Disabled'}</li>
                        <li>• Analytics: {configuration.analytics ? 'Enabled' : 'Disabled'}</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Implementation Analytics
              </CardTitle>
              <CardDescription>
                Track the performance and usage of your widget implementation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">1,250</div>
                  <div className="text-sm text-gray-600">Total Interactions</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">89%</div>
                  <div className="text-sm text-gray-600">Success Rate</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">2.3s</div>
                  <div className="text-sm text-gray-600">Avg Load Time</div>
                </div>
              </div>
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Recent Activity</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Last 24 hours</span>
                    <span className="font-medium">156 interactions</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last 7 days</span>
                    <span className="font-medium">1,089 interactions</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last 30 days</span>
                    <span className="font-medium">4,567 interactions</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WidgetImplementation;
