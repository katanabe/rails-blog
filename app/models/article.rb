class Article < ApplicationRecord
  belongs_to :user
  validates :title, presence: true
  validates :body, presence: true
  has_one_attached :image

  scope :published, -> { where.not(published_at: nil) }
  scope :draft, -> { where(published_at: nil) }
end
