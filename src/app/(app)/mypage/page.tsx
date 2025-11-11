"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { LogOut, Edit, HelpCircle, User, BarChart2, Settings } from "lucide-react";
import {
  useInvestmentPersonality,
  personalityTextMap,
} from "@/contexts/investment-personality-context";
import {
  useIndicatorPreferences,
  AVAILABLE_INDICATORS,
} from "@/contexts/indicator-preference-context";
import { OnboardingModal } from "@/components/survey/onboarding-modal";
import { IndicatorHelpModal } from "@/components/survey/indicator-help-modal";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function MyPage() {
  const { data: session } = useSession();
  const { personality, answers } = useInvestmentPersonality();
  const { preferences } = useIndicatorPreferences();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [modalStartStep, setModalStartStep] = useState<"quiz" | "indicators">("quiz");

  const handleOpenModal = (startStep: "quiz" | "indicators") => {
    setModalStartStep(startStep);
    setIsModalOpen(true);
  };

  const personalityInfo = personality ? personalityTextMap[personality] : null;

  return (
    <>
      <div className="space-y-8">
        {/* Account Information Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-xl font-semibold">계정 정보</h2>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={() => signOut()}>
                    <LogOut className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>로그아웃</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="p-6 rounded-lg bg-muted/50 flex items-center gap-6">
            <Avatar className="h-16 w-16">
              <AvatarImage
                src={session?.user?.image ?? undefined}
                alt={session?.user?.name ?? ""}
              />
              <AvatarFallback className="text-2xl">
                {session?.user?.name?.charAt(0) ?? "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-lg font-semibold">{session?.user?.name}</p>
              <p className="text-muted-foreground">
                {session?.user?.email}
              </p>
            </div>
          </div>
        </section>

        <Separator />

        {/* Investment Personality Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BarChart2 className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-xl font-semibold">나의 투자 성향</h2>
            </div>
            <Button variant="outline" size="sm" onClick={() => handleOpenModal("quiz")}>
              <Edit className="mr-2 h-4 w-4" />
              다시 분석하기
            </Button>
          </div>
          {personalityInfo ? (
            <div className="p-6 rounded-lg bg-muted/50">
              <p className="text-lg font-bold text-primary">{personalityInfo.title}</p>
              <p className="mt-2 text-muted-foreground">{personalityInfo.description}</p>
            </div>
          ) : (
            <p className="text-muted-foreground">아직 투자 성향 분석을 완료하지 않았습니다.</p>
          )}
        </section>

        <Separator />

        {/* Indicator Preferences Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Settings className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-xl font-semibold">나의 선호 지표</h2>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={() => setIsHelpModalOpen(true)}>
                      <HelpCircle className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>지표 설명 보기</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex items-center gap-2">
              
              <Button variant="outline" size="sm" onClick={() => handleOpenModal("indicators")}>
                <Edit className="mr-2 h-4 w-4" />
                설정 변경하기
              </Button>
            </div>
          </div>
          <div className="p-6 rounded-lg bg-muted/50">
            {preferences && preferences.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {preferences.map((p) => (
                  <div
                    key={p}
                    className="px-3 py-1.5 text-sm font-medium bg-background border rounded-full"
                  >
                    {AVAILABLE_INDICATORS[p]}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">선택된 선호 지표가 없습니다.</p>
            )}
          </div>
        </section>
      </div>

      {/* Modals */}
      <OnboardingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialIndicators={preferences ?? undefined}
        initialAnswers={answers ?? undefined}
        initialStep={modalStartStep}
      />
      <IndicatorHelpModal 
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
      />
    </>
  );
}
