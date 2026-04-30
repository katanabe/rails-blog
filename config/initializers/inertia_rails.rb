InertiaRails.configure do |config|
  config.version = ViteRuby.digest
  config.ssr_enabled = true
  config.always_include_errors_hash = true
end
