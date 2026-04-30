export type Article = {
  id: number
  title: string
  body: string
  published_at: string | null
  image_url: string | null
  user_id: number
}

export type AuthUser = {
  id: number
  email: string
}

export type SharedProps = {
  auth: { user: AuthUser | null }
  flash: { notice: string | null; alert: string | null }
}
