// middleware.ts
import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

const PUBLIC_ROUTES = ['/login', '/auth/callback'];

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user, supabase } = await updateSession(request);
  const { pathname } = request.nextUrl;

  const isPublic = PUBLIC_ROUTES.some(
    (r) => pathname === r || pathname.startsWith(`${r}/`)
  );

  // Niet ingelogd
  if (!user) {
    if (isPublic) return supabaseResponse;

    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Ingelogd, maar op /login → stuur naar juiste dashboard
  if (pathname === '/login') {
    const role = await getRole(supabase, user.id);
    const url = request.nextUrl.clone();
    url.pathname = dashboardForRole(role);
    return NextResponse.redirect(url);
  }

  // Rol-based routing
  const role = await getRole(supabase, user.id);
  const denied = isDenied(pathname, role);
  if (denied) {
    const url = request.nextUrl.clone();
    url.pathname = dashboardForRole(role);
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

async function getRole(
  supabase: Awaited<ReturnType<typeof updateSession>>['supabase'],
  userId: string
): Promise<string | null> {
  const { data } = await supabase
    .from('profiles')
    .select('role, is_active')
    .eq('id', userId)
    .single();
  if (!data || !data.is_active) return null;
  return data.role;
}

function dashboardForRole(role: string | null): string {
  switch (role) {
    case 'ADMIN':
      return '/admin/import';
    case 'IT':
      return '/it';
    case 'FRONT_OFFICER':
      return '/front-office';
    default:
      return '/login';
  }
}

function isDenied(pathname: string, role: string | null): boolean {
  if (!role) return true;

  // /admin/* → ADMIN
  if (pathname.startsWith('/admin')) return role !== 'ADMIN';

  // /it/* → IT of ADMIN
  if (pathname.startsWith('/it')) return role !== 'IT' && role !== 'ADMIN';

  // /front-office/* → FRONT_OFFICER of ADMIN
  if (pathname.startsWith('/front-office'))
    return role !== 'FRONT_OFFICER' && role !== 'ADMIN';

  // /audit/* → IT of ADMIN
  if (pathname.startsWith('/audit')) return role !== 'IT' && role !== 'ADMIN';

  return false;
}

export const config = {
  matcher: [
    /*
     * Match alle paden behalve:
     *  - _next/static, _next/image
     *  - favicon
     *  - publieke assets
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};