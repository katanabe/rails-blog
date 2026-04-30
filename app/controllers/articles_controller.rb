class ArticlesController < ApplicationController
  layout "inertia"
  before_action :authenticate_user!, only: [ :new, :create, :edit, :update, :destroy ]
  before_action :set_article, only: [ :show, :edit, :update, :destroy ]
  before_action :authorize_user!, only: [ :edit, :update, :destroy ]

  def index
    articles =
      if current_user
        Article.published.or(current_user.articles.draft).order(created_at: :desc)
      else
        Article.published.order(created_at: :desc)
      end
    render inertia: "Articles/Index", props: {
      articles: articles.map { |a| article_props(a) }
    }
  end

  def show
    render inertia: "Articles/Show", props: {
      article: article_props(@article)
    }
  end

  def new
    render inertia: "Articles/New"
  end

  def create
    @article = current_user.articles.build(article_params)
    if @article.save
      redirect_to @article, notice: "記事を投稿しました"
    else
      render inertia: "Articles/New", props: { article: @article.as_json }, status: :unprocessable_entity
    end
  end

  def edit
    render inertia: "Articles/Edit", props: {
      article: article_props(@article)
    }
  end

  def update
    if @article.update(article_params)
      redirect_to @article, notice: "記事を更新しました"
    else
      render inertia: "Articles/Edit", props: {
        article: article_props(@article),
        errors: @article.errors.full_messages
      }, status: :unprocessable_entity
    end
  end

  def destroy
    @article.destroy
    redirect_to articles_path, notice: "記事を削除しました"
  end

  private

  def set_article
    @article = Article.find(params[:id])
  end

  def authorize_user!
    redirect_to root_path, alert: "権限がありません" unless @article.user == current_user
  end

  def article_params
    params.require(:article).permit(:title, :body, :image, :published_at)
  end

  def article_props(article)
    {
      id: article.id,
      title: article.title,
      body: article.body,
      published_at: article.published_at,
      created_at: article.created_at,
      user_id: article.user_id,
      image_url: article.image.attached? ? url_for(article.image) : nil
    }
  end
end
