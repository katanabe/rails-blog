json.extract! article, :id, :title, :body, :published_at, :created_at, :updated_at
json.user_id article.user_id
json.image_url(article.image.attached? ? url_for(article.image) : nil)
