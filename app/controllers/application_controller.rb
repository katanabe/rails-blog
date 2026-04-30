class ApplicationController < ActionController::Base
  allow_browser versions: :modern
  stale_when_importmap_changes

  inertia_share do
    {
      auth: {
        user: current_user ? { id: current_user.id, email: current_user.email } : nil
      },
      flash: {
        notice: flash[:notice],
        alert: flash[:alert]
      }
    }
  end
end
