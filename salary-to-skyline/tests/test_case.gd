class_name TestCase
extends RefCounted

## Minimal assertion base for the project test suite.
## A test method is any method whose name starts with `test_`.
## A failed assertion records a message and lets the method continue, so one run
## reports every problem it can see rather than only the first.

var failures: Array[String] = []
var assertions: int = 0
var _current: String = ""


func set_current_test(name: String) -> void:
	_current = name


func before_each() -> void:
	pass


func after_each() -> void:
	pass


func fail(message: String) -> void:
	failures.append("%s: %s" % [_current, message])


func check(condition: bool, message: String) -> bool:
	assertions += 1
	if not condition:
		fail(message)
	return condition


func assert_true(condition: bool, message: String) -> bool:
	return check(condition, message)


func assert_false(condition: bool, message: String) -> bool:
	return check(not condition, message)


func assert_eq(actual: Variant, expected: Variant, message: String) -> bool:
	return check(actual == expected, "%s (expected %s, got %s)" % [message, str(expected), str(actual)])


func assert_ne(actual: Variant, unexpected: Variant, message: String) -> bool:
	return check(actual != unexpected, "%s (did not expect %s)" % [message, str(unexpected)])


## Compares minor-unit amounts and reports them in readable currency.
func assert_money(actual_minor: int, expected_minor: int, message: String) -> bool:
	return check(actual_minor == expected_minor, "%s (expected %s, got %s)" % [
		message, Money.format(expected_minor), Money.format(actual_minor)])


## Asserts a Money-style Result succeeded and returns its value.
func assert_ok(result: Dictionary, message: String) -> Variant:
	assertions += 1
	if not result.get("ok", false):
		fail("%s — rejected with %s: %s" % [
			message, result.get("code", "?"), result.get("message", "")])
		return null
	return result.get("value", null)


## Asserts a Result failed, optionally with a specific error code.
func assert_err(result: Dictionary, expected_code: String, message: String) -> bool:
	assertions += 1
	if result.get("ok", false):
		fail("%s — expected rejection '%s' but the call succeeded" % [message, expected_code])
		return false
	if not expected_code.is_empty() and String(result.get("code", "")) != expected_code:
		fail("%s — expected code '%s', got '%s' (%s)" % [
			message, expected_code, result.get("code", ""), result.get("message", "")])
		return false
	return true
