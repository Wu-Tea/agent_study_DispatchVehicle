from fastapi import APIRouter, HTTPException, Request

from app.schemas.agent import CleanupRequest, CleanupResponse, ParseRequest, ParseResponse

router = APIRouter()


def get_parse_service(request: Request):
    return request.app.state.parse_service


def get_cleanup_service(request: Request):
    return request.app.state.cleanup_service


@router.post("/api/agent/cleanup", response_model=CleanupResponse)
async def cleanup_agent(payload: CleanupRequest, request: Request) -> CleanupResponse:
    service = get_cleanup_service(request)
    result = await service.cleanup(payload.transcript)
    return CleanupResponse.model_validate(result)


@router.post("/api/agent/parse", response_model=ParseResponse)
async def parse_agent(payload: ParseRequest, request: Request) -> ParseResponse:
    service = get_parse_service(request)
    try:
        result = await service.parse(payload)
    except RuntimeError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error
    return ParseResponse.model_validate(result)
