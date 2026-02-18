# modules/operador.py
TOOL = {
    "type": "operador",
    "label": "Operador",
    "description": "Aplica un operador binario entre A (input0) y B (input1 o constante).",
    "config": {
        "op": {"type": "string", "label": "Operador", "default": "+"},
        "b":  {"type": "string", "label": "B (si no hay input1)", "default": "0"}
    }
}

def _to_number(x):
    try:
        if isinstance(x, (int, float)): return float(x)
        s = str(x).strip()
        return float(s) if "." in s else float(int(s))
    except Exception:
        return None

def execute(config, context):
    op = (config.get("op") or "+").strip()
    b_cfg = config.get("b", "0")

    ins = context.get("inputs", [])
    a = ins[0] if len(ins) > 0 else None
    b = ins[1] if len(ins) > 1 else b_cfg

    # soporte numérico
    a_num = _to_number(a)
    b_num = _to_number(b)

    if op in ("+", "-", "*", "/", "%"):
        if a_num is None or b_num is None:
            # si no es numérico, + hace concatenación
            if op == "+":
                return {"value": str(a) + str(b), "type": "string"}
            return {"value": None, "type": "error", "error": "Operación numérica con datos no numéricos"}
        if op == "+":  return {"value": a_num + b_num, "type": "number"}
        if op == "-":  return {"value": a_num - b_num, "type": "number"}
        if op == "*":  return {"value": a_num * b_num, "type": "number"}
        if op == "/":  return {"value": (a_num / b_num) if b_num != 0 else None, "type": "number"}
        if op == "%":  return {"value": (a_num % b_num) if b_num != 0 else None, "type": "number"}

    # comparaciones básicas
    if op in ("==", "!=", "<", ">", "<=", ">="):
        if a_num is not None and b_num is not None:
            av, bv = a_num, b_num
        else:
            av, bv = str(a), str(b)
        if op == "==": return {"value": av == bv, "type": "bool"}
        if op == "!=": return {"value": av != bv, "type": "bool"}
        if op == "<":  return {"value": av <  bv, "type": "bool"}
        if op == ">":  return {"value": av >  bv, "type": "bool"}
        if op == "<=": return {"value": av <= bv, "type": "bool"}
        if op == ">=": return {"value": av >= bv, "type": "bool"}

    return {"value": None, "type": "error", "error": f"Operador no soportado: {op}"}

