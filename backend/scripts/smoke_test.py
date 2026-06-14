"""Quick local integration test — run from backend/: python scripts/smoke_test.py"""
import asyncio
import io
import json
import sys
from pathlib import Path

import httpx

BASE = "http://127.0.0.1:8000"
PASSWORD = "televault-test"


async def main() -> int:
    results = {}
    async with httpx.AsyncClient(timeout=120.0) as client:
        health = (await client.get(f"{BASE}/health/ready")).json()
        results["health"] = health

        unlock = (
            await client.post(
                f"{BASE}/api/v1/auth/unlock",
                json={"master_password": PASSWORD},
            )
        ).json()
        token = unlock["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        content = b"TeleDrive smoke test file\n"
        files = {"file": ("smoke-test.txt", io.BytesIO(content), "text/plain")}
        data = {"tags": "test", "description": "smoke test upload"}
        upload = (
            await client.post(
                f"{BASE}/api/v1/files/upload",
                headers=headers,
                files=files,
                data=data,
            )
        )
        results["upload_status"] = upload.status_code
        upload_body = upload.json() if upload.status_code == 200 else upload.text
        results["upload"] = upload_body

        if upload.status_code != 200:
            print(json.dumps(results, indent=2))
            return 1

        file_id = upload_body["file_id"]
        listing = (await client.get(f"{BASE}/api/v1/files", headers=headers)).json()
        results["file_count"] = listing["total"]

        download = await client.get(
            f"{BASE}/api/v1/files/{file_id}/download",
            headers=headers,
        )
        results["download_status"] = download.status_code
        results["download_matches"] = download.content == content

        await client.delete(f"{BASE}/api/v1/files/{file_id}", headers=headers)

    out = Path(__file__).resolve().parents[1] / "smoke_test_result.json"
    out.write_text(json.dumps(results, indent=2), encoding="utf-8")
    print(f"Wrote {out}")
    ok = (
        results.get("health", {}).get("telegram") == "connected"
        and results.get("upload_status") == 200
        and results.get("download_matches") is True
    )
    print("PASS" if ok else "FAIL")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
