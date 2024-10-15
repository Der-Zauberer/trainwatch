DEFINE TABLE IF NOT EXISTS StopSearch SCHEMAFULL
	PERMISSIONS
		FOR select FULL;
DEFINE FIELD OVERWRITE entries ON TABLE StopSearch TYPE array<object>;
DEFINE FIELD OVERWRITE entries.*.stop ON TABLE StopSearch TYPE record<Stop>;
DEFINE FIELD OVERWRITE entries.*.name ON TABLE StopSearch TYPE string;
DEFINE FIELD OVERWRITE entries.*.score ON TABLE StopSearch TYPE number;

DEFINE EVENT OVERWRITE stop_update ON TABLE Stop WHEN $before.name != $after.name || $before.ids != $after.ids THEN {
    UPDATE StopSearch SET entries = entries.filter(|$v| $v.id != $before.id) WHERE id = type::thing('StopSearch', $before.name);
    DELETE StopSearch WHERE id = type::thing('StopSearch', $before.name) AND array::is_empty(entries);
    UPSERT ONLY type::thing('StopSearch', $after.name) SET id = $after.name, entries += { stop: $after.id, name: $after.name, score: $after.score };
};