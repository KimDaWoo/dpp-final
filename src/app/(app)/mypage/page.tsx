"use client";

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation'; // useRouter 임포트
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export default function MyPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [investmentType, setInvestmentType] = useState<string | null>(null);

  useEffect(() => {
    const type = localStorage.getItem('investmentType');
    setInvestmentType(type);
  }, []);

  const handleRetakeQuiz = () => {
    localStorage.removeItem('investmentType');
    router.push('/quiz');
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  if (status === 'loading') {
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
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">마이페이지</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>계정 정보</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={session?.user?.image ?? undefined} alt={session?.user?.name ?? ''} />
            <AvatarFallback>{getInitials(session?.user?.name ?? 'User')}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-lg font-semibold">{session?.user?.name}</p>
            <p className="text-muted-foreground">{session?.user?.email}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="space-y-1.5">
            <CardTitle>나의 투자 성향</CardTitle>
            <CardDescription>이 성향은 기업 분석 체크리스트의 기준에 자동으로 반영됩니다.</CardDescription>
          </div>
          <Button variant="outline" onClick={handleRetakeQuiz}>성향 다시 분석하기</Button>
        </CardHeader>
        <CardContent>
          <p className="text-lg">
            분석 결과: <span className="font-bold text-primary">{investmentType === 'aggressive' ? '공격적 투자자' : '보수적 투자자'}</span>
          </p>
        </CardContent>
      </Card>

      <Button 
        variant="destructive" 
        className="w-full sm:w-auto"
        onClick={() => signOut({ callbackUrl: '/' })}
      >
        로그아웃
      </Button>
    </div>
  );
}
