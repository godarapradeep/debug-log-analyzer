/*
 * Copyright (c) 2020 FinancialForce.com, inc. All rights reserved.
 */
import { SFDX, SFDXResponse } from '../SFDX';

export interface GetLogFilesResult {
  /* eslint-disable @typescript-eslint/naming-convention */
  Id: string;
  Application: string;
  DurationMilliseconds: number;
  Location: string;
  LogLength: number;
  LogUser: {
    attributes: {
      type: string;
      url: string;
    };
    Name: string;
  };
  Operation: string;
  Request: string;
  StartTime: string;
  Status: string;
}

export class GetLogFiles {
  static async apply(path: string): Promise<SFDXResponse<GetLogFilesResult[]>> {
    const result = await SFDX.apply(path, ['force:apex:log:list', '--json']);
    return JSON.parse(result) as SFDXResponse<GetLogFilesResult[]>;
  }
}
