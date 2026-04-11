from typing import Any

from pydantic import BaseModel, Field


class AgentUpdate(BaseModel):
    fieldName: str
    fieldValue: Any


class OverwriteField(BaseModel):
    fieldName: str
    oldValue: Any
    newValue: Any


class CleanupMeta(BaseModel):
    ruleApplied: bool = False
    ollamaAttempted: bool = False
    ollamaUsed: bool = False
    fallbackToRuleCleaned: bool = False


class CleanupRequest(BaseModel):
    transcript: str = Field(min_length=1)


class CleanupResponse(BaseModel):
    rawTranscript: str = ""
    cleanedTranscript: str = ""
    cleanupMeta: CleanupMeta = Field(default_factory=CleanupMeta)


class ParseRequest(BaseModel):
    taskKey: str
    buttonKey: str
    transcript: str = Field(min_length=1)
    formData: dict[str, Any]
    supportedFields: list[str]
    fieldOptions: dict[str, list[dict[str, Any]]] = Field(default_factory=dict)


class ParseResponse(BaseModel):
    respMessage: str
    updates: list[AgentUpdate]
    overwriteFields: list[OverwriteField]
    confirmRequired: bool = True
    rawTranscript: str = ""
    cleanedTranscript: str = ""
    cleanupMeta: CleanupMeta = Field(default_factory=CleanupMeta)
