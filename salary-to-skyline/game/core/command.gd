class_name Command
extends RefCounted

## A validated player action.
##
## Every money-changing action carries a unique command ID and the state revision
## the player was looking at when they chose it. If the state has moved on, the
## command is refused with no partial mutation (acceptance case T04), which is
## what makes a stale quote or a double-tapped button safe.

var id: String = ""
var type: String = ""
var payload: Dictionary = {}
var expected_revision: int = -1

const TYPE_ADVANCE_MONTH: String = "advance_month"
const TYPE_SPEND_DISCRETIONARY: String = "spend_discretionary"
const TYPE_EARMARK_SAVINGS: String = "earmark_savings"
const TYPE_RELEASE_SAVINGS: String = "release_savings"

const KNOWN_TYPES: Array = [
	TYPE_ADVANCE_MONTH,
	TYPE_SPEND_DISCRETIONARY,
	TYPE_EARMARK_SAVINGS,
	TYPE_RELEASE_SAVINGS,
]


static func create(command_id: String, command_type: String, expected_state_revision: int,
		command_payload: Dictionary = {}) -> Command:
	var command := Command.new()
	command.id = command_id
	command.type = command_type
	command.expected_revision = expected_state_revision
	command.payload = command_payload.duplicate(true)
	return command


func validate() -> Dictionary:
	if not Ids.is_valid_runtime_id(id):
		return Money.err("invalid_command_id", "command id '%s' is not a valid runtime id" % id)
	if not KNOWN_TYPES.has(type):
		return Money.err("unknown_command", "unknown command type '%s'" % type)
	if expected_revision < 0:
		return Money.err("missing_revision", "command '%s' has no expected state revision" % id)
	return Money.ok_value(true)
