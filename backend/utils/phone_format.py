"""휴대폰·전화번호 표시용 (하이픈 구분)."""


def normalize_phone_digits(raw: str) -> str:
    if not raw:
        return ""
    trimmed = str(raw).strip()
    if not trimmed:
        return ""

    digits = []
    for ch in trimmed:
        if "0" <= ch <= "9":
            digits.append(ch)
            continue
        cp = ord(ch)
        if 0xFF10 <= cp <= 0xFF19:
            digits.append(chr(cp - 0xFF10 + 0x30))

    result = "".join(digits)
    if result.startswith("82") and len(result) >= 10:
        result = f"0{result[2:]}"
    return result


def format_phone_display(raw: str) -> str:
    trimmed = (raw or "").strip()
    if not trimmed:
        return ""

    digits = normalize_phone_digits(trimmed)
    if not digits:
        return trimmed

    if len(digits) == 11 and digits.startswith("01"):
        return f"{digits[:3]}-{digits[3:7]}-{digits[7:]}"

    if digits.startswith("02"):
        rest = digits[2:]
        if len(rest) == 7:
            return f"02-{rest[:3]}-{rest[3:]}"
        if len(rest) == 8:
            return f"02-{rest[:4]}-{rest[4:]}"

    if len(digits) == 10 and digits.startswith("0"):
        return f"{digits[:3]}-{digits[3:6]}-{digits[6:]}"

    if len(digits) == 9 and digits.startswith("02"):
        rest = digits[2:]
        return f"02-{rest[:3]}-{rest[3:]}"

    if len(digits) == 8:
        return f"{digits[:4]}-{digits[4:]}"

    if len(digits) == 7:
        return f"{digits[:3]}-{digits[3:]}"

    if "-" in trimmed:
        return trimmed
    return digits
