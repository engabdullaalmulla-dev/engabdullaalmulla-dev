class_name ShareAdapter
extends RefCounted

## Interface for the optional "My Empire" share card (brief section 22).
##
## Sharing is always an explicit player action with a preview and a cancel. This
## build implements no sharing: the interface exists so the presentation layer
## can be written against it, and so that nothing silently auto-posts, uploads,
## or reads contacts. Any share card must carry a "Simulation" label.

func adapter_name() -> String:
	return "none"


func is_available() -> bool:
	return false


## Returns { ok, value: { shared: bool, cancelled: bool } }.
func share_image(_image_path: String, _caption: String) -> Dictionary:
	return Money.err("not_implemented",
		"sharing is not implemented in this build; no data leaves the device")
