import * as vscode from "vscode";
import { Settings } from "./Settings";

export class Log {
  constructor(
    public readonly name?: string,
    private readonly logLevel?: LogLevel
  ) {
    this.name = name || "Log";
    this.logLevel = logLevel || Settings.logLevel;
  }
  static activate(
    logFunction: (message: string, level: LogLevel) => void
  ): void {
    this.log = logFunction;
  }
  private static log: (message: string, level: LogLevel) => void;
  /**
   * Use this to automatically generate message entering function "foo"
   *
   * @memberof Log
   */
  Trace(message: (() => any) | string): void {
    if (this.logLevel <= LogLevel.Trace) {
      // If no message is given get caller name

      this.LogMessage(
        "[TRACE] " + this.getLogName() + this.getMessageString(message),
        LogLevel.Trace
      );
    }
  }

  TraceEnterFunction(functionName?: any): void {
    if (this.logLevel <= LogLevel.Trace) {
      // If no message is given get caller name
      if (!functionName) {
        try {
          let re = /Log\.Trace[\s\S]+?at (?:(?!Generator\.next|__awaiter|Promise|Function.get|(?:\w+[:\\.,?!<>])+)(\w+))/g;
          let aRegexResult = re.exec(new Error().stack);
          functionName = "Entering function '" + aRegexResult[1] + "'";
        } catch (error) {
          functionName =
            "Could not determine Function Name at " + new Error().stack;
        }
      }

      this.LogMessage(
        "[TRACE] " +
          this.getLogName() +
          this.getMessageString(() => functionName),
        LogLevel.Trace
      );
    }
  }

  Debug(message: (() => any) | string): void {
    if (this.logLevel <= LogLevel.Debug) {
      this.LogMessage(
        "[DEBUG] " + this.getLogName() + this.getMessageString(message),
        LogLevel.Debug
      );
    }
  }

  Info(message: (() => any) | string): void {
    if (this.logLevel <= LogLevel.Info) {
      this.LogMessage(
        "[INFO ] " + this.getLogName() + this.getMessageString(message),
        LogLevel.Info
      );
    }
  }

  Warn(message: (() => any) | string): void {
    if (this.logLevel <= LogLevel.Warning) {
      this.LogMessage(
        "[WARN ] " + this.getMessageString(message),
        LogLevel.Warning
      );
    }
  }

  Error(message: (() => any) | string): void {
    if (this.logLevel <= LogLevel.Error) {
      this.LogMessage(
        "[ERROR] " + this.getMessageString(message),
        LogLevel.Error
      );
    }
  }

  Fatal(message: (() => any) | string): void {
    if (this.logLevel <= LogLevel.Fatal) {
      this.LogMessage(
        "[FATAL] " + this.getMessageString(message),
        LogLevel.Fatal
      );
    }
  }

  private getMessageString(message: (() => any) | string): string {
    let msg: any;
    if (typeof message === "string") msg = message;
    else msg = message();
    return typeof msg === "string" ? msg : msg.toString();
  }

  private getLogName(): string {
    return this.name + ": ";
  }

  LogMessage(message: string, logLevel: LogLevel): void {
    Log.log(message, logLevel);
  }
}

export enum LogLevel {
  Trace,
  Debug,
  Info,
  Warning,
  Error,
  Fatal,
  None
}
