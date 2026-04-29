class Api::V1::ArticlesController < ApplicationController
  skip_before_action :verify_authenticity_token
  before_action :authenticate_user!, only: [ :create, :update, :destroy ]
  before_action :set_article, only: [ :show, :update, :destroy ]
  before_action :authorize_user!, only: [ :update, :destroy ]

  def index
    @articles =
      if current_user
        Article.published.or(current_user.articles.draft).order(created_at: :desc)
      else
        Article.published.order(created_at: :desc)
      end
  end

  def show
  end

  def create
    @article = current_user.articles.build(article_params)
    if @article.save
      render :show, status: :created
    else
      render json: { errors: @article.errors }, status: :unprocessable_entity
    end
  end

  def update
    if @article.update(article_params)
      render :show
    else
      render json: { errors: @article.errors }, status: :unprocessable_entity
    end
  end

  def destroy
    @article.destroy
    head :no_content
  end

  private

  def set_article
    @article = Article.find(params[:id])
  end

  def authorize_user!
    head :forbidden unless @article.user == current_user
  end

  def article_params
    params.require(:article).permit(:title, :body, :image, :published_at)
  end
end
