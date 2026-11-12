import { Injectable } from "@nestjs/common";
import { ApiRequest } from "../../common/api-request";
import { getBalneabilityOverview } from "../../services/balneabilityService";

@Injectable()
export class BalneabilityService {
  async balneabilityHandler(req: ApiRequest) {
    return await getBalneabilityOverview();
  }
}
