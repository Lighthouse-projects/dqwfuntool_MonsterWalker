// Supabase Edge Function: delete-account
// アカウント削除（Admin API経由）

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  // CORSプリフライト対応
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 環境変数からSupabase設定を取得
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Admin クライアント（service_role key使用）
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // リクエストからJWTを取得
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: '認証が必要です' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // JWTからユーザー情報を取得
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'ユーザー情報の取得に失敗しました' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const userId = user.id

    // 1. Storage: avatarsバケットからアイコン画像を削除
    try {
      const { data: avatarFiles } = await supabaseAdmin.storage
        .from('avatars')
        .list(userId)

      if (avatarFiles && avatarFiles.length > 0) {
        const filePaths = avatarFiles.map((file) => `${userId}/${file.name}`)
        await supabaseAdmin.storage.from('avatars').remove(filePaths)
      }
    } catch (e) {
      console.error('Avatar deletion error:', e)
      // 画像削除エラーは無視して続行
    }

    // 2. Storage: mw_screenshotsバケットからスクリーンショットを削除
    try {
      const { data: screenshotFolders } = await supabaseAdmin.storage
        .from('mw_screenshots')
        .list(userId)

      if (screenshotFolders && screenshotFolders.length > 0) {
        // 各フォルダ内のファイルを削除
        for (const folder of screenshotFolders) {
          const { data: files } = await supabaseAdmin.storage
            .from('mw_screenshots')
            .list(`${userId}/${folder.name}`)

          if (files && files.length > 0) {
            const filePaths = files.map((file) => `${userId}/${folder.name}/${file.name}`)
            await supabaseAdmin.storage.from('mw_screenshots').remove(filePaths)
          }
        }

        // フォルダ自体を削除
        const folderPaths = screenshotFolders.map((folder) => `${userId}/${folder.name}`)
        await supabaseAdmin.storage.from('mw_screenshots').remove(folderPaths)
      }
    } catch (e) {
      console.error('Screenshot deletion error:', e)
      // 画像削除エラーは無視して続行
    }

    // 3. auth.usersからユーザーを削除（CASCADE削除で関連データも自動削除）
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (deleteError) {
      console.error('User deletion error:', deleteError)
      return new Response(
        JSON.stringify({ error: 'アカウントの削除に失敗しました' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true, message: 'アカウントを削除しました' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: '予期せぬエラーが発生しました' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
