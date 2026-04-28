from unittest.mock import MagicMock


HEADERS = {"x-workspace-id": "ws-1", "x-idempotency-key": "idem-key-1"}
FAKE_JPEG = b"\xff\xd8\xff\xe0" + b"\x00" * 200  # minimal JPEG header bytes


def test_upload_new_file_returns_202(client, mock_db, mocker):
    mocker.patch("app.api.upload.file_crud.get_by_idempotency_key", return_value=None)
    mocker.patch("app.api.upload.s3.upload")
    record = MagicMock(id="file-1", status=MagicMock(value="pending"))
    mocker.patch("app.api.upload.file_crud.create", return_value=record)
    mocker.patch("app.api.upload.process_image.delay")

    resp = client.post(
        "/api/v1/upload/image",
        files={"file": ("photo.jpg", FAKE_JPEG, "image/jpeg")},
        headers=HEADERS,
    )

    assert resp.status_code == 202
    body = resp.json()
    assert body["fileId"] == "file-1"
    assert body["status"] == "pending"


def test_upload_idempotent_returns_existing_record(client, mock_db, mocker):
    existing = MagicMock(id="file-1", status=MagicMock(value="done"))
    mocker.patch("app.api.upload.file_crud.get_by_idempotency_key", return_value=existing)

    resp = client.post(
        "/api/v1/upload/image",
        files={"file": ("photo.jpg", FAKE_JPEG, "image/jpeg")},
        headers=HEADERS,
    )

    assert resp.status_code == 202
    body = resp.json()
    assert body["fileId"] == "file-1"
    assert body["status"] == "done"
    assert body["idempotent"] is True


def test_upload_rejects_unsupported_content_type(client, mock_db, mocker):
    mocker.patch("app.api.upload.file_crud.get_by_idempotency_key", return_value=None)

    resp = client.post(
        "/api/v1/upload/image",
        files={"file": ("doc.pdf", b"%PDF-1.4", "application/pdf")},
        headers=HEADERS,
    )

    assert resp.status_code == 415


def test_upload_rejects_oversized_file(client, mock_db, mocker):
    mocker.patch("app.api.upload.file_crud.get_by_idempotency_key", return_value=None)
    big_file = b"\xff\xd8\xff" + b"\x00" * (21 * 1024 * 1024)  # 21 MB

    resp = client.post(
        "/api/v1/upload/image",
        files={"file": ("big.jpg", big_file, "image/jpeg")},
        headers=HEADERS,
    )

    assert resp.status_code == 413


def test_dispatch_called_with_correct_record_id(client, mock_db, mocker):
    mocker.patch("app.api.upload.file_crud.get_by_idempotency_key", return_value=None)
    mocker.patch("app.api.upload.s3.upload")
    record = MagicMock(id="file-42", status=MagicMock(value="pending"))
    mocker.patch("app.api.upload.file_crud.create", return_value=record)
    mock_delay = mocker.patch("app.api.upload.process_image.delay")

    client.post(
        "/api/v1/upload/image",
        files={"file": ("photo.jpg", FAKE_JPEG, "image/jpeg")},
        headers=HEADERS,
    )

    mock_delay.assert_called_once()
    call_kwargs = mock_delay.call_args.kwargs
    assert call_kwargs["record_id"] == "file-42"
    assert call_kwargs["workspace_id"] == "ws-1"
