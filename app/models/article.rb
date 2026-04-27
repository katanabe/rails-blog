class Article < ApplicationRecord
  belongs_to :user
  validates :title, presence: true
  validates :body, presence: true

  scope :published, -> { where.not(published_at: nil).order(published_at: :desc) }
end
