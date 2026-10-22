from pydantic import BaseModel


class InitializePaymentIn(BaseModel):
    plan_id: str