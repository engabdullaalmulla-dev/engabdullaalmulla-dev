#!/usr/bin/env ruby
# Generates an isolated local StoreKit harness. Never edits the shipped iOS app.
require 'fileutils'
require 'xcodeproj'
root = File.expand_path(ARGV.fetch(0))
abort 'Choose a new, empty output directory' if File.exist?(root)
FileUtils.mkdir_p(root)
source = File.expand_path(__dir__)
project = Xcodeproj::Project.new(File.join(root, 'CafeStoreKitTests.xcodeproj'))
host = project.new_target(:application, 'CafeStoreKitHost', :ios, '17.0')
tests = project.new_target(:unit_test_bundle, 'CafeStoreKitTests', :ios, '17.0')
[host, tests].each do |target|
  target.build_configurations.each do |config|
    config.build_settings['SWIFT_VERSION'] = '5.9'
    config.build_settings['GENERATE_INFOPLIST_FILE'] = 'YES'
    config.build_settings['TARGETED_DEVICE_FAMILY'] = '1'
    config.build_settings['CODE_SIGNING_ALLOWED'] = 'YES'
    config.build_settings['CODE_SIGN_IDENTITY[sdk=iphonesimulator*]'] = '-'
    config.build_settings['PRODUCT_BUNDLE_IDENTIFIER'] = "com.almulla.cafelife.localtests.#{target.name.downcase}"
  end
end
File.write(File.join(root, 'Host.entitlements'), <<~PLIST)
  <?xml version="1.0" encoding="UTF-8"?>
  <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
  <plist version="1.0"><dict><key>get-task-allow</key><true/></dict></plist>
PLIST
host.build_configurations.each do |config|
  config.build_settings['CODE_SIGN_ENTITLEMENTS'] = 'Host.entitlements'
  config.build_settings['INFOPLIST_KEY_UILaunchScreen_Generation'] = 'YES'
  config.build_settings['INFOPLIST_KEY_UIApplicationSceneManifest_Generation'] = 'YES'
  config.build_settings['INFOPLIST_KEY_UISupportedInterfaceOrientations'] = 'UIInterfaceOrientationPortrait'
end
tests.build_configurations.each do |config|
  config.build_settings['TEST_HOST'] = '$(BUILT_PRODUCTS_DIR)/CafeStoreKitHost.app/CafeStoreKitHost'
  config.build_settings['BUNDLE_LOADER'] = '$(TEST_HOST)'
end
File.write(File.join(root, 'Host.swift'), <<~SWIFT)
  import UIKit
  @main final class AppDelegate: UIResponder, UIApplicationDelegate {
    func application(_ application: UIApplication, configurationForConnecting session: UISceneSession, options: UIScene.ConnectionOptions) -> UISceneConfiguration {
      let config = UISceneConfiguration(name: "StoreKit tests", sessionRole: session.role)
      config.delegateClass = SceneDelegate.self
      return config
    }
  }
  final class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?
    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options: UIScene.ConnectionOptions) {
      guard let scene = scene as? UIWindowScene else { return }
      let window = UIWindow(windowScene: scene)
      window.rootViewController = UIViewController()
      window.makeKeyAndVisible()
      self.window = window
    }
  }
SWIFT
host.source_build_phase.add_file_reference(project.main_group.new_file(File.join(root, 'Host.swift')))
[source + '/CafePurchaseStoreTests.swift', File.expand_path('../../modules/cafe-purchases/ios/CafePurchaseStore.swift', source)].each do |path|
  abort "Missing production/test source: #{path}" unless File.file?(path)
  tests.source_build_phase.add_file_reference(project.main_group.new_file(path))
end
tests.resources_build_phase.add_file_reference(project.main_group.new_file(source + '/CafeLifePremium.storekit'))
# XCTest and StoreKitTest live in the platform's Developer frameworks, not System.
tests.build_configurations.each do |config|
  config.build_settings['FRAMEWORK_SEARCH_PATHS'] = ['$(inherited)', '$(PLATFORM_DIR)/Developer/Library/Frameworks']
end
tests.add_dependency(host)
project.save
scheme = Xcodeproj::XCScheme.new
scheme.add_build_target(host)
scheme.add_build_target(tests)
scheme.add_test_target(tests)
scheme.set_launch_target(host)
# Activate the local test catalogue in Xcode as well as loading it via SKTestSession.
scheme.launch_action.xml_element.add_element('StoreKitConfigurationFileReference', { 'identifier' => source + '/CafeLifePremium.storekit' })
scheme.save_as(project.path, 'CafeStoreKitTests')
puts project.path
