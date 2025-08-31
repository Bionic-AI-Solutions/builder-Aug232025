import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiCall } from "@/lib/auth";
import { User, Mail, Shield, Calendar, Edit, Save, X } from "lucide-react";

export default function ProfilePage() {
    const { user, updateUser } = useAuth();
    const { toast } = useToast();
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: user?.name || "",
        email: user?.email || "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    const getPersonaDisplayName = (persona: string) => {
        switch (persona) {
            case 'super_admin':
                return 'Super Admin';
            case 'builder':
                return 'Builder';
            case 'end_user':
                return 'End User';
            default:
                return 'User';
        }
    };

    const getPersonaColor = (persona: string) => {
        switch (persona) {
            case 'super_admin':
                return 'bg-red-100 text-red-800';
            case 'builder':
                return 'bg-blue-100 text-blue-800';
            case 'end_user':
                return 'bg-green-100 text-green-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSave = async () => {
        setIsLoading(true);

        try {
            // Validate passwords if changing
            if (formData.newPassword) {
                if (formData.newPassword !== formData.confirmPassword) {
                    toast({
                        title: "Password Mismatch",
                        description: "New password and confirm password do not match.",
                        variant: "destructive",
                    });
                    return;
                }

                if (formData.newPassword.length < 8) {
                    toast({
                        title: "Password Too Short",
                        description: "New password must be at least 8 characters long.",
                        variant: "destructive",
                    });
                    return;
                }
            }

            const updateData: any = {
                name: formData.name,
                email: formData.email,
            };

            if (formData.newPassword) {
                updateData.currentPassword = formData.currentPassword;
                updateData.newPassword = formData.newPassword;
            }

            const response = await apiCall('/auth/profile', {
                method: 'PUT',
                body: JSON.stringify(updateData),
            });

            if (response.success) {
                // Update local user state
                updateUser({
                    ...user!,
                    name: formData.name,
                    email: formData.email,
                });

                toast({
                    title: "Profile Updated",
                    description: "Your profile has been updated successfully.",
                });

                setIsEditing(false);
                setFormData(prev => ({
                    ...prev,
                    currentPassword: "",
                    newPassword: "",
                    confirmPassword: "",
                }));
            }
        } catch (error) {
            console.error('Profile update error:', error);
            toast({
                title: "Update Failed",
                description: error instanceof Error ? error.message : "Failed to update profile.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        setFormData({
            name: user?.name || "",
            email: user?.email || "",
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
        });
        setIsEditing(false);
    };

    if (!user) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <p className="text-gray-500 mb-4">Please log in to view your profile.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-2xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile</h1>
                    <p className="text-gray-600">Manage your account settings and preferences</p>
                </div>

                <div className="space-y-6">
                    {/* Profile Information Card */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <User className="w-5 h-5" />
                                        Profile Information
                                    </CardTitle>
                                    <CardDescription>
                                        Your personal information and account details
                                    </CardDescription>
                                </div>
                                {!isEditing && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setIsEditing(true)}
                                        className="flex items-center gap-2"
                                    >
                                        <Edit className="w-4 h-4" />
                                        Edit
                                    </Button>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Current Profile Display */}
                            {!isEditing && (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-xl font-medium">
                                            {user.name ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase() : user.email.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold">{user.name || user.email}</h3>
                                            <Badge className={getPersonaColor(user.persona)}>
                                                {getPersonaDisplayName(user.persona)}
                                            </Badge>
                                        </div>
                                    </div>

                                    <Separator />

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="flex items-center gap-3">
                                            <Mail className="w-4 h-4 text-gray-500" />
                                            <div>
                                                <p className="text-sm font-medium">Email</p>
                                                <p className="text-sm text-gray-600">{user.email}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <Shield className="w-4 h-4 text-gray-500" />
                                            <div>
                                                <p className="text-sm font-medium">Persona</p>
                                                <p className="text-sm text-gray-600">{getPersonaDisplayName(user.persona)}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <Calendar className="w-4 h-4 text-gray-500" />
                                            <div>
                                                <p className="text-sm font-medium">Member Since</p>
                                                <p className="text-sm text-gray-600">
                                                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <Shield className="w-4 h-4 text-gray-500" />
                                            <div>
                                                <p className="text-sm font-medium">Status</p>
                                                <Badge variant={user.isActive ? "default" : "secondary"}>
                                                    {user.isActive ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Edit Form */}
                            {isEditing && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Name</Label>
                                            <Input
                                                id="name"
                                                value={formData.name}
                                                onChange={(e) => handleInputChange('name', e.target.value)}
                                                placeholder="Enter your name"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="email">Email</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => handleInputChange('email', e.target.value)}
                                                placeholder="Enter your email"
                                            />
                                        </div>
                                    </div>

                                    <Separator />

                                    <div className="space-y-4">
                                        <h4 className="font-medium">Change Password (Optional)</h4>

                                        <div className="space-y-2">
                                            <Label htmlFor="currentPassword">Current Password</Label>
                                            <Input
                                                id="currentPassword"
                                                type="password"
                                                value={formData.currentPassword}
                                                onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                                                placeholder="Enter current password"
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="newPassword">New Password</Label>
                                                <Input
                                                    id="newPassword"
                                                    type="password"
                                                    value={formData.newPassword}
                                                    onChange={(e) => handleInputChange('newPassword', e.target.value)}
                                                    placeholder="Enter new password"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="confirmPassword">Confirm Password</Label>
                                                <Input
                                                    id="confirmPassword"
                                                    type="password"
                                                    value={formData.confirmPassword}
                                                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                                                    placeholder="Confirm new password"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 pt-4">
                                        <Button
                                            onClick={handleSave}
                                            disabled={isLoading}
                                            className="flex items-center gap-2"
                                        >
                                            <Save className="w-4 h-4" />
                                            {isLoading ? 'Saving...' : 'Save Changes'}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={handleCancel}
                                            disabled={isLoading}
                                            className="flex items-center gap-2"
                                        >
                                            <X className="w-4 h-4" />
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Account Security Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="w-5 h-5" />
                                Account Security
                            </CardTitle>
                            <CardDescription>
                                Manage your account security settings
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 border rounded-lg">
                                    <div>
                                        <h4 className="font-medium">Two-Factor Authentication</h4>
                                        <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
                                    </div>
                                    <Button variant="outline" size="sm">
                                        Enable
                                    </Button>
                                </div>

                                <div className="flex items-center justify-between p-4 border rounded-lg">
                                    <div>
                                        <h4 className="font-medium">Session Management</h4>
                                        <p className="text-sm text-gray-600">View and manage your active sessions</p>
                                    </div>
                                    <Button variant="outline" size="sm">
                                        Manage
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
