import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Camera, MapPin, User, Loader2, Building, UserCircle, Trophy, BadgeCheck, Shield, Briefcase, Star, Crown, HelpCircle, Target, Award, Swords, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRating } from "@/hooks/useUserRating";
import { useTradeStats } from "@/hooks/useTradeStats";
import { useGamification } from "@/hooks/useGamification";
import { useUserType } from "@/hooks/useUserType";
import { useServiceInquiryNotifications } from "@/hooks/useServiceInquiryNotifications";
import UserRating from "@/components/UserRating";
import UserLevelBadge from "@/components/UserLevelBadge";
import VerificationDialog from "@/components/VerificationDialog";
import CompanyDashboard from "@/components/CompanyDashboard";
import CompanyAnalyticsChart from "@/components/CompanyAnalyticsChart";
import QuickReplies from "@/components/QuickReplies";
import PremiumBadge from "@/components/PremiumBadge";
import ThemeSelector from "@/components/ThemeSelector";
import BottomNav from "@/components/BottomNav";
import { useUserPremiumStatus } from "@/hooks/useUserPremiumStatus";

const Profile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, loading, updateProfile, uploadAvatar } = useProfile();
  const { averageRating, reviewCount } = useUserRating(user?.id);
  const { stats } = useTradeStats();
  const { userLevel } = useGamification();
  const { isCompany, updateUserType } = useUserType();
  useServiceInquiryNotifications();
  const { isPremium, planName } = useUserPremiumStatus(user?.id);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState("");
  const [location, setLocation] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [userType, setUserType] = useState<"person" | "company">("person");
  const [isVerified, setIsVerified] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (profile && !initialized) {
      setDisplayName(profile.display_name || "");
      setLocation(profile.location || "");
      setBio(profile.bio || "");
      setAvatarUrl(profile.avatar_url || "");
      setUserType((profile as any).user_type || "person");
      setIsVerified((profile as any).is_verified || false);
      setInitialized(true);
    }
  }, [profile, initialized]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) return;

    setUploadingAvatar(true);
    const { url, error } = await uploadAvatar(file);
    
    if (url && !error) {
      setAvatarUrl(url);
      await updateProfile({ avatar_url: url });
    }
    setUploadingAvatar(false);
  };

  const handleUserTypeChange = async (type: "person" | "company") => {
    setUserType(type);
    await updateUserType(type);
  };

  const handleSave = async () => {
    setSaving(true);
    await updateProfile({
      display_name: displayName,
      location,
      bio,
      avatar_url: avatarUrl,
      user_type: userType,
    } as any);
    setSaving(false);
  };

  const getInitials = () => {
    if (displayName) {
      return displayName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
    }
    return user?.email?.[0].toUpperCase() || "U";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex items-center justify-between p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Mi Perfil</h1>
          <div className="w-10" />
        </div>
      </header>

      <div className="p-4 space-y-5 max-w-md mx-auto pb-24">
        {/* User Type Toggle - At the top */}
        <div className="flex items-center justify-center gap-1 p-1 bg-muted rounded-full">
          <button
            onClick={() => handleUserTypeChange("person")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-full transition-all ${
              userType === "person" 
                ? "bg-primary text-primary-foreground shadow-md" 
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <UserCircle className="h-4 w-4" />
            <span className="font-medium text-sm">Persona</span>
          </button>
          <button
            onClick={() => handleUserTypeChange("company")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-full transition-all ${
              userType === "company" 
                ? "bg-secondary text-secondary-foreground shadow-md" 
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Building className="h-4 w-4" />
            <span className="font-medium text-sm">Empresa</span>
          </button>
        </div>

        {/* Avatar Section */}
        <div className="flex flex-col items-center space-y-3">
          <div className="relative">
            <Avatar className="h-20 w-20 border-4 border-primary/20">
              <AvatarImage src={avatarUrl} alt={displayName} />
              <AvatarFallback className="text-xl bg-primary/10 text-primary">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <button
              onClick={handleAvatarClick}
              disabled={uploadingAvatar}
              className="absolute bottom-0 right-0 p-1.5 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {uploadingAvatar ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Camera className="h-3 w-3" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>
          
          {/* Name and badges */}
          <div className="text-center space-y-2">
            <h2 className="text-lg font-semibold">{displayName || "Tu nombre"}</h2>
            <div className="flex items-center gap-2 flex-wrap justify-center">
              {reviewCount > 0 && (
                <UserRating rating={averageRating} count={reviewCount} size="sm" />
              )}
              {isPremium && planName && (
                <PremiumBadge planName={planName} variant="minimal" size="sm" />
              )}
              {isVerified && (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">
                  <BadgeCheck className="h-3 w-3" />
                  <span>Verificado</span>
                </div>
              )}
              {userLevel && (
                <UserLevelBadge 
                  level={userLevel.level} 
                  experiencePoints={userLevel.experience_points} 
                />
              )}
            </div>
          </div>
        </div>

        {/* Dynamic Content Based on User Type */}
        {userType === "person" ? (
          <>
            {/* Person Stats */}
            <Card>
              <CardContent className="p-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-primary">{stats.completedTrades}</p>
                    <p className="text-xs text-muted-foreground">Truekes</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-secondary">{stats.averageRating || "-"}</p>
                    <p className="text-xs text-muted-foreground">Rating</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-accent">{stats.successRate}%</p>
                    <p className="text-xs text-muted-foreground">Éxito</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Person Gamification */}
            <div className="grid grid-cols-3 gap-2">
              <Card 
                className="bg-gradient-to-br from-trueke-pink/10 to-trueke-orange/10 border-trueke-pink/20 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate("/missions")}
              >
                <CardContent className="p-3 flex flex-col items-center text-center">
                  <div className="p-2 rounded-xl bg-trueke-pink/20 mb-1">
                    <Target className="h-4 w-4 text-trueke-pink" />
                  </div>
                  <p className="font-medium text-xs">Misiones</p>
                </CardContent>
              </Card>
              <Card 
                className="bg-gradient-to-br from-trueke-cyan/10 to-trueke-green/10 border-trueke-cyan/20 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate("/achievements")}
              >
                <CardContent className="p-3 flex flex-col items-center text-center">
                  <div className="p-2 rounded-xl bg-trueke-cyan/20 mb-1">
                    <Award className="h-4 w-4 text-trueke-cyan" />
                  </div>
                  <p className="font-medium text-xs">Logros</p>
                </CardContent>
              </Card>
              <Card 
                className="bg-gradient-to-br from-trueke-orange/10 to-trueke-yellow/10 border-trueke-orange/20 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate("/tournaments")}
              >
                <CardContent className="p-3 flex flex-col items-center text-center">
                  <div className="p-2 rounded-xl bg-trueke-orange/20 mb-1">
                    <Swords className="h-4 w-4 text-trueke-orange" />
                  </div>
                  <p className="font-medium text-xs">Torneos</p>
                </CardContent>
              </Card>
            </div>

            {/* Person Quick Actions */}
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                className="h-auto py-3 flex-col gap-1"
                onClick={() => navigate("/my-products")}
              >
                <Briefcase className="h-5 w-5" />
                <span className="text-xs">Mis Productos</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto py-3 flex-col gap-1"
                onClick={() => navigate("/trade-history")}
              >
                <Trophy className="h-5 w-5" />
                <span className="text-xs">Historial</span>
              </Button>
            </div>
          </>
        ) : (
          <>
            {/* Company Dashboard */}
            <CompanyDashboard />
            
            {/* Company Analytics */}
            <CompanyAnalyticsChart />
            
            {/* Company Quick Actions */}
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                className="h-auto py-3 flex-col gap-1"
                onClick={() => navigate("/my-products")}
              >
                <Briefcase className="h-5 w-5" />
                <span className="text-xs">Mis Servicios</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto py-3 flex-col gap-1"
                onClick={() => navigate("/featured-services")}
              >
                <Star className="h-5 w-5" />
                <span className="text-xs">Explorar Servicios</span>
              </Button>
            </div>
            
            {/* Quick Replies */}
            <QuickReplies onSelectReply={(text) => {
              navigator.clipboard.writeText(text);
            }} />
          </>
        )}

        {/* Premium Section */}
        <Card className="bg-gradient-to-r from-trueke-yellow/10 to-trueke-orange/10 border-trueke-yellow/30">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-trueke-yellow/20">
              <Crown className="h-5 w-5 text-trueke-yellow" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">
                {isPremium ? `Plan ${planName}` : "Planes Premium"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {isPremium ? "Gestiona tu suscripción" : "Más visibilidad"}
              </p>
            </div>
            <Button 
              className="bg-gradient-to-r from-trueke-yellow to-trueke-orange text-white hover:opacity-90 shrink-0"
              size="sm"
              onClick={() => navigate("/subscription")}
            >
              {isPremium ? "Ver" : "Planes"}
            </Button>
          </CardContent>
        </Card>

        {/* Edit Profile Section */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <h3 className="font-medium text-sm text-muted-foreground">Editar perfil</h3>
            
            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="displayName" className="text-xs flex items-center gap-1">
                  <User className="h-3 w-3" />
                  Nombre
                </Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder={userType === "person" ? "Tu nombre" : "Nombre de empresa"}
                  className="h-10"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="location" className="text-xs flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  Ubicación
                </Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Ciudad, País"
                  className="h-10"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="bio" className="text-xs">
                  {userType === "person" ? "Bio" : "Descripción de la empresa"}
                </Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder={userType === "person" ? "Cuéntanos sobre ti..." : "Describe tu empresa y servicios..."}
                  rows={3}
                />
              </div>
            </div>

            <Button
              onClick={handleSave}
              disabled={saving}
              className="w-full"
              size="sm"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Guardando...
                </>
              ) : (
                "Guardar cambios"
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Verification Section */}
        {!isVerified && (
          <Card className="bg-gradient-to-r from-primary/10 to-secondary/10">
            <CardContent className="p-3 flex items-center gap-3">
              <Shield className="h-8 w-8 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">Verifica tu identidad</p>
                <p className="text-xs text-muted-foreground">
                  Genera más confianza
                </p>
              </div>
              <VerificationDialog />
            </CardContent>
          </Card>
        )}

        {/* Settings Section */}
        <div className="space-y-2">
          <h3 className="font-medium text-sm text-muted-foreground px-1">Configuración</h3>
          
          {/* Theme Selector */}
          <ThemeSelector variant="compact" className="w-full justify-center" />

          {/* Tutorial */}
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-3 h-12"
            onClick={() => navigate("/")}
          >
            <HelpCircle className="h-5 w-5 text-muted-foreground" />
            <span>Ver tutorial</span>
          </Button>

          {/* Terms */}
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-3 h-12"
            onClick={() => navigate("/terms")}
          >
            <FileText className="h-5 w-5 text-muted-foreground" />
            <span>Términos y condiciones</span>
          </Button>
        </div>

        {/* Email (read-only) */}
        <div className="space-y-1 pt-2">
          <Label className="text-xs text-muted-foreground">Email</Label>
          <Input
            value={user?.email || ""}
            disabled
            className="h-10 bg-muted"
          />
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Profile;
