require "test_helper"

class Api::V1::ArticlesTest < ActionDispatch::IntegrationTest
  test "index returns only published when unauthenticated" do
    get "/api/v1/articles", headers: { "Accept" => "application/json" }
    assert_response :ok
    body = JSON.parse(response.body)
    assert(body.all? { |a| a["published_at"].present? })
  end

  test "index includes own drafts when authenticated" do
    user = users(:one)
    token = login_as(user)
    get "/api/v1/articles",
        headers: { "Accept" => "application/json", "Authorization" => token }

    assert_response :ok
    body = JSON.parse(response.body)
    assert(body.any? { |a| a["user_id"] == user.id && a["published_at"].nil? })
  end

  test "create requires authentication" do
    post "/api/v1/articles",
          params: { article: { title: "x", body: "y" } }.to_json,
          headers: { "Content-Type" => "application/json", "Accept" => "application/json" }
    assert_response :unauthorized
  end

  test "create persists with current_user as owner" do
    user = users(:one)
    token = login_as(user)

    assert_difference "Article.count", 1 do
      post "/api/v1/articles",
            params: { article: { title: "新記事", body: "本文" } }.to_json,
            headers: { "Content-Type" => "application/json", "Accept" => "application/json",
                      "Authorization" => token }
    end
    assert_response :created
    body = JSON.parse(response.body)
    assert_equal user.id, body["user_id"]
  end

  test "update by non-owner returns 403" do
    owner = users(:one)
    other = users(:two)
    article = articles(:one)  # belongs_to user one
    token = login_as(other)

    patch "/api/v1/articles/#{article.id}",
          params: { article: { title: "改ざん" } }.to_json,
          headers: { "Content-Type" => "application/json", "Accept" => "application/json",
                      "Authorization" => token }
    assert_response :forbidden
    assert_equal "MyString", article.reload.title  # fixture の元の値
  end
end
