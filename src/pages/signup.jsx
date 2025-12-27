;

import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, ArrowLeft, Loader2 } from "lucide-react";
import { useAuthStore } from "../state/store";
import { toast } from "sonner";

export default function SignupPage() {
  const navigate = useNavigate();
  const { signup, isAuthenticated } = useAuthStore();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "operator",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/cases", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      return;
    }

    const result = await signup(
      formData.email,
      formData.password,
      formData.name,
      formData.role
    );
    
    setLoading(false);

    if (result.success) {
      toast.success("Account created successfully", {
        duration: 2000,
      });
      navigate("/cases", { replace: true });
    } else {
      let errorMessage = result.error || "Failed to create account";
      
      toast.error(errorMessage, {
        duration: result.errorCode === "auth/configuration-not-found" ? 10000 : 4000,
      });
      
      if (result.errorCode === "auth/email-already-in-use" || errorMessage.includes("already registered")) {
        setErrors({ email: "This email is already registered" });
      } else if (result.errorCode === "auth/weak-password" || errorMessage.includes("weak")) {
        setErrors({ password: "Password is too weak" });
      } else if (result.errorCode === "auth/invalid-email" || errorMessage.includes("Invalid email")) {
        setErrors({ email: "Invalid email address" });
      }
      
      if (result.errorCode === "auth/configuration-not-found" || errorMessage.includes("not enabled")) {
     
      }
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <div className="min-h-screen min-h-[100dvh] flex items-center justify-center bg-background p-4 sm:p-6 lg:p-8">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-[400px] sm:max-w-md relative animate-fade-in-up shadow-lg">
        <CardHeader className="text-center pb-4 sm:pb-6">
          <div className="flex justify-center mb-4 sm:mb-5">
            <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl bg-primary/10 flex items-center justify-center">
              <FileText className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
            </div>
          </div>
          <CardTitle className="text-xl sm:text-2xl">Create Account</CardTitle>
          <CardDescription className="text-sm">
            Join CaseFlow to start managing case data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                error={!!errors.name}
                autoComplete="name"
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                error={!!errors.email}
                autoComplete="email"
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => handleChange("role", value)}
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="operator">Operator</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {formData.role === "admin"
                  ? "Full access to all features and user management"
                  : "Access to case management and validation"}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="At least 6 characters"
                value={formData.password}
                onChange={(e) => handleChange("password", e.target.value)}
                error={!!errors.password}
                autoComplete="new-password"
              />
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Re-enter password"
                value={formData.confirmPassword}
                onChange={(e) =>
                  handleChange("confirmPassword", e.target.value)
                }
                error={!!errors.confirmPassword}
                autoComplete="new-password"
              />
              {errors.confirmPassword && (
                <p className="text-xs text-destructive">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full h-10 sm:h-11" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>
          </form>

          <div className="mt-6 sm:mt-8 text-center">
            <Link
              to="/login"
              className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-2 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
