import pytest
from io import BytesIO
from PIL import Image
from unittest.mock import MagicMock, call
from app.models.file_record import FileStatus


def _make_jpeg(width: int = 200, height: int = 100) -> bytes:
    buf = BytesIO()
    Image.new("RGB", (width, height), color=(255, 0, 0)).save(buf, format="JPEG")
    return buf.getvalue()


TASK_KWARGS = dict(
    record_id="rec-1",
    s3_key="uploads/ws-1/key-1/photo.jpg",
    workspace_id="ws-1",
    options={"width": 100, "format": "WEBP", "quality": 80},
)


@pytest.fixture(autouse=True)
def mock_session(mocker):
    mock_db = MagicMock()
    mocker.patch("app.tasks.image_tasks.SessionLocal", return_value=mock_db)
    return mock_db


def test_successful_processing_transitions_to_done(mocker):
    mocker.patch("app.tasks.image_tasks.s3.download", return_value=_make_jpeg())
    mocker.patch("app.tasks.image_tasks.s3.upload")
    update = mocker.patch("app.tasks.image_tasks.file_crud.update_status")
    publish = mocker.patch("app.tasks.image_tasks.notifier.publish")

    from app.tasks.image_tasks import process_image
    process_image.apply(kwargs=TASK_KWARGS)

    statuses = [c.kwargs["status"] for c in update.call_args_list]
    assert statuses[0] == FileStatus.PROCESSING
    assert statuses[1] == FileStatus.DONE

    publish.assert_called_once()
    assert publish.call_args.args[1] == "file:processed"
    assert publish.call_args.args[2]["status"] == "done"


def test_failed_task_after_max_retries_marks_failed(mocker):
    mocker.patch("app.tasks.image_tasks.s3.download", side_effect=ConnectionError("S3 down"))
    update = mocker.patch("app.tasks.image_tasks.file_crud.update_status")
    publish = mocker.patch("app.tasks.image_tasks.notifier.publish")

    from app.tasks.image_tasks import process_image
    # apply(retries=3) simulates running after all retries exhausted
    with pytest.raises(Exception):
        process_image.apply(kwargs=TASK_KWARGS, retries=3)

    last_status = update.call_args_list[-1].kwargs["status"]
    assert last_status == FileStatus.FAILED

    publish.assert_called_once()
    assert publish.call_args.args[2]["status"] == "failed"


def test_transform_resizes_image_to_target_width():
    from app.tasks.image_tasks import _transform

    raw = _make_jpeg(width=800, height=400)
    result_bytes, out_key = _transform(raw, "uploads/ws/k/photo.jpg", {"width": 200, "format": "WEBP", "quality": 85})

    result_img = Image.open(BytesIO(result_bytes))
    assert result_img.width == 200
    assert result_img.height == 100  # preserved aspect ratio
    assert out_key == "processed/ws/k/photo.webp"


def test_transform_converts_extension_in_output_key():
    from app.tasks.image_tasks import _transform

    raw = _make_jpeg()
    _, out_key = _transform(raw, "uploads/ws/k/image.png", {"width": 100, "format": "WEBP", "quality": 85})
    assert out_key.endswith(".webp")
    assert out_key.startswith("processed/")


def test_upload_called_with_correct_content_type(mocker):
    mocker.patch("app.tasks.image_tasks.s3.download", return_value=_make_jpeg())
    mock_upload = mocker.patch("app.tasks.image_tasks.s3.upload")
    mocker.patch("app.tasks.image_tasks.file_crud.update_status")
    mocker.patch("app.tasks.image_tasks.notifier.publish")

    from app.tasks.image_tasks import process_image
    process_image.apply(kwargs=TASK_KWARGS)

    _, upload_kwargs = mock_upload.call_args
    # Third positional arg is content_type
    content_type = mock_upload.call_args.args[2]
    assert content_type == "image/webp"
