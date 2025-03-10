import { NextRequest, NextResponse } from 'next/server';

import { getSupabaseServerClient } from '@kit/supabase/server-client';

import { createDailyStreakApi } from '~/hub/_lib/daily-streak/api';

/**
 * Middleware pour enregistrer les connexions des utilisateurs
 * et mettre à jour leur streak quotidienne
 */
export async function middleware(_request: NextRequest) {
  try {
    // Créer un client Supabase pour le middleware
    const supabase = getSupabaseServerClient();

    // Vérifier si l'utilisateur est connecté - utiliser getSession au lieu de getUser
    // car getUser peut parfois causer des problèmes dans les middlewares
    const { data } = await supabase.auth.getSession();

    if (data?.session?.user) {
      try {
        // Créer l'API de streak et enregistrer la connexion
        const streakApi = createDailyStreakApi(supabase);
        await streakApi.recordLogin(data.session.user.id);
      } catch (streakError) {
        // Capturer l'erreur spécifique de l'API sans interrompre le flux
        console.error('Error in streak API:', streakError);
      }
    }
  } catch (error) {
    // Logguer l'erreur mais ne pas bloquer la navigation
    console.error('Error in streak middleware:', error);
  }

  // Continuer la requête normalement
  return NextResponse.next();
}

// Configurer le middleware pour s'exécuter uniquement sur les routes du hub
export const config = {
  matcher: '/hub/:path*',
};
