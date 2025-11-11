"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  useIndicatorPreferences,
  AVAILABLE_INDICATORS,
} from "@/contexts/indicator-preference-context";
import { useInvestmentPersonality } from "@/contexts/investment-personality-context";
import { TrendingUp, Target, SlidersHorizontal, LogOut } from "lucide-react";
import { OnboardingModal } from "@/components/survey/onboarding-modal";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function MyPage() {
  const { data: session, status } = useSession();
  const {
    preferences: indicatorPreferences,
  } = useIndicatorPreferences();
  const { personality, quizAnswers } = useInvestmentPersonality();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const personalityTextMap = {
    aggressive: "공격적 투자자",
    moderate: "중립적 투자자",
    conservative: "보수적 투자자",
  };

  if (status === "loading") {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-52" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <OnboardingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialIndicators={indicatorPreferences || []}
        initialAnswers={quizAnswers || undefined}
      />
      <div className="space-y-24">
        <div>
          <div className="flex items-center gap-1 mb-3">
            <h2 className="text-lg font-bold">계정 정보</h2>
          </div>
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-6">
                  <Avatar className="h-12 w-12">
                    <AvatarImage
                      src={session?.user?.image ?? undefined}
                      alt={session?.user?.name ?? ""}
                    />
                    <AvatarFallback>
                      {getInitials(session?.user?.name ?? "User")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <p className="text-lg font-semibold">
                      {session?.user?.name}
                    </p>
                    <p className="text-muted-foreground">
                      {session?.user?.email}
                    </p>
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="ml-auto"
                          onClick={() => signOut({ callbackUrl: "/" })}
                        >
                          <LogOut className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>로그아웃</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </CardTitle>
              </CardHeader>
            </Card>
          </div>
        </div>


        <div>
          <div className="flex items-center gap-1 mb-3">
            <h2 className="text-lg font-bold">설정</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsModalOpen(true)}
              className="rounded-full h-8 w-8 border-2"
            >
              <SlidersHorizontal className="h-3 w-3" />
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  나의 투자 성향
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {personality
                    ? personalityTextMap[personality]
                    : "성향 분석 필요"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  이 성향은 기업 분석 체크리스트의 기준에 자동으로 반영됩니다.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  나의 선호 지표
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {indicatorPreferences && indicatorPreferences.length > 0 ? (
                    indicatorPreferences.map((key) => (
                      <Badge key={key} variant="secondary">
                        {AVAILABLE_INDICATORS[key]}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      선호 지표가 설정되지 않았습니다.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        
      </div>
    </>
  );
}
