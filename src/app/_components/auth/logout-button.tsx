'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const onLogout = async () => {
    setLoading(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.replace('/login');
      router.refresh();
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  return (
    <>
      <Button variant='outline' size='sm' onClick={() => setOpen(true)} disabled={loading}>
        {loading ? '로그아웃 중...' : '로그아웃'}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent onClose={() => setOpen(false)}>
          <DialogHeader>
            <DialogTitle>콘솔에서 로그아웃할까요?</DialogTitle>
            <DialogDescription>
              나중에 다시 들어올 수 있지만, 보호된 동기화 화면은 다시 로그인해야 합니다.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant='ghost' onClick={() => setOpen(false)} disabled={loading}>
              취소
            </Button>
            <Button
              variant='destructive'
              onClick={() => {
                void onLogout();
              }}
              disabled={loading}
            >
              {loading ? '로그아웃 중...' : '로그아웃'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
