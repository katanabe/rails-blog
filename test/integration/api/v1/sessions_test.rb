require "test_helper"

class Api::V1::SessionsTest < ActionDispatch::IntegrationTest
  test "login returns JWT and user payload" do
    user = users(:one)  # fixtures からユーザを取得
    post "/api/v1/login",
          params: { user: { email: user.email, password: "password" } }.to_json,
          headers: { "Content-Type" => "application/json", "Accept" => "application/json" }

    assert_response :ok
    assert_match %r{\ABearer eyJ}, response.headers["Authorization"]
    body = JSON.parse(response.body)
    assert_equal user.email, body["user"]["email"]
  end

  test "login fails with wrong password" do
    user = users(:one)
    post "/api/v1/login",
         params: { user: { email: user.email, password: "wrong" } }.to_json,
         headers: { "Content-Type" => "application/json", "Accept" => "application/json" }

    assert_response :unauthorized
    assert_nil response.headers["Authorization"]
  end

  test "logout rotates jti and returns 204" do
    user = users(:one)
    token = login_as(user)
    jti_before = user.reload.jti

    delete "/api/v1/logout", headers: { "Authorization" => token }

    assert_response :no_content
    assert_not_equal jti_before, user.reload.jti
  end

  test "signup creates user and issues JWT" do
    assert_difference "User.count", 1 do
      post "/api/v1/signup",
            params: { user: { email: "fresh@example.com",
                              password: "password",
                              password_confirmation: "password" } }.to_json,
            headers: { "Content-Type" => "application/json", "Accept" => "application/json" }
    end

    assert_response :created
    assert_match %r{\ABearer eyJ}, response.headers["Authorization"]
    body = JSON.parse(response.body)
    assert_equal "fresh@example.com", body["user"]["email"]
  end

  test "signup fails when email is taken" do
    taken = users(:one).email
    assert_no_difference "User.count" do
      post "/api/v1/signup",
            params: { user: { email: taken,
                              password: "password",
                              password_confirmation: "password" } }.to_json,
            headers: { "Content-Type" => "application/json", "Accept" => "application/json" }
    end

    assert_response :unprocessable_entity
    body = JSON.parse(response.body)
    assert_includes body["errors"]["email"], "has already been taken"
  end
end
