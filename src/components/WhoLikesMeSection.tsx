import { useState } from "react";
import { Eye, Heart, Star, Lock, Crown, User, Clock, ChevronRight, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useWhoLikesMe } from "@/hooks/useWhoLikesMe";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

const WhoLikesMeSection = () => {
  const { likes, loading, canSeeLikes, blurredCount, totalLikes } = useWhoLikesMe();
  const navigate = useNavigate();

  if (loading) {
    return (
      <Card className="border-trueke-pink/30 bg-gradient-to-br from-trueke-pink/5 to-trueke-teal/5">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Eye className="h-5 w-5 text-trueke-pink" />
            Quién te likea
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-trueke-pink/30 bg-gradient-to-br from-trueke-pink/5 to-trueke-teal/5">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Eye className="h-5 w-5 text-trueke-pink" />
            Quién te likea
            {totalLikes > 0 && (
              <Badge className="bg-trueke-pink text-white text-xs">
                {totalLikes}
              </Badge>
            )}
          </CardTitle>
          {!canSeeLikes && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-trueke-yellow"
              onClick={() => navigate("/subscription")}
            >
              <Crown className="h-3 w-3 mr-1" />
              Desbloquear
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Visible likes (super likes or all if premium) */}
        {likes.length > 0 ? (
          <ScrollArea className="max-h-60">
            <div className="space-y-2 pr-2">
              {likes.map((like) => (
                <div
                  key={like.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-background/50 hover:bg-background transition-colors cursor-pointer"
                >
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={like.liker_avatar || undefined} />
                      <AvatarFallback>
                        <User className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                    {like.is_super_like && (
                      <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-gradient-to-r from-trueke-yellow to-amber-500 flex items-center justify-center">
                        <Star className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate">{like.liker_name}</p>
                      {like.is_super_like && (
                        <Badge className="bg-gradient-to-r from-trueke-yellow to-amber-500 text-white text-[10px] px-1.5">
                          Super Like
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      Le gustó: {like.product_title}
                    </p>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(like.created_at), { locale: es, addSuffix: true })}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <Heart className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Aún no tienes likes</p>
          </div>
        )}

        {/* Blurred likes for non-premium */}
        {!canSeeLikes && blurredCount > 0 && (
          <div className="relative">
            <div className="absolute inset-0 backdrop-blur-sm bg-background/50 z-10 flex flex-col items-center justify-center rounded-lg">
              <Lock className="h-6 w-6 text-trueke-yellow mb-2" />
              <p className="text-sm font-medium">{blurredCount} likes ocultos</p>
              <Button
                size="sm"
                className="mt-2 bg-gradient-to-r from-trueke-yellow to-trueke-orange hover:opacity-90 text-white"
                onClick={() => navigate("/subscription")}
              >
                <Sparkles className="h-3 w-3 mr-1" />
                Ver todos
              </Button>
            </div>
            <div className="space-y-2 opacity-50">
              {[1, 2, 3].slice(0, Math.min(3, blurredCount)).map((i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="h-10 w-10 rounded-full bg-muted" />
                  <div className="flex-1 space-y-1">
                    <div className="h-4 w-24 rounded bg-muted" />
                    <div className="h-3 w-32 rounded bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WhoLikesMeSection;
