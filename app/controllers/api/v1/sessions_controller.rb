class Api::V1::SessionsController < Devise::SessionsController
  skip_before_action :verify_authenticity_token
  skip_before_action :verify_signed_out_user, only: :destroy
  respond_to :json

  private

  def respond_with(resource, _opts = {})
    render json: { user: { id: resource.id, email: resource.email } }, status: :ok
  end

  def respond_to_on_destroy(non_navigational_status: :no_content)
    head non_navigational_status
  end
end
