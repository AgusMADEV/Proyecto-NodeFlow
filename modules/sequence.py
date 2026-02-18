# modules/sequence.py
from typing import Dict, Any, List

TOOL = {
    "type": "sequence",
    "label": "Secuencia",
    "description": "Envía el payload por pasos (1..N). Cada activación avanza al siguiente paso.",
    "config": {
        "pasos": {"type": "number", "label": "Pasos", "default": 2},
        "ciclico": {"type": "boolean", "label": "Cíclico", "default": False},
    }
}

def _pick_payload(inputs: List[Any]):
    # último elemento no None
    payload = None
    for it in inputs or []:
        if it is not None:
            payload = it
    return payload

def execute(config: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
    pasos = int(config.get("pasos") or 2)
    pasos = max(1, min(pasos, 12))  # límite práctico
    ciclico = bool(config.get("ciclico") or False)

    state = context.get("state") or {}
    i = int(state.get("i") or 0)

    payload = _pick_payload(context.get("inputs", []))

    # Si no hay payload, no hacemos nada (evita que fuentes se auto-repitan)
    if payload is None:
        return {"routes": {}, "result": {"paso": i+1, "pasos": pasos}, "_state": {"i": i}}

    if i >= pasos:
        if ciclico:
            i = 0
        else:
            # fuera de rango: no enruta nada
            return {"routes": {}, "result": {"paso": pasos, "pasos": pasos, "fin": True}, "_state": {"i": i}}

    port = str(i+1)
    routes = {port: payload}

    i2 = i + 1
    # si termina y es cíclico, volvemos a 0 para la próxima
    if i2 >= pasos and ciclico:
        i2 = 0

    return {
        "routes": routes,
        "result": {"paso": int(port), "pasos": pasos, "ciclico": ciclico},
        "_state": {"i": i2}
    }

