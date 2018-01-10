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
  static activate(): any {
    Log.log = vscode.window.createOutputChannel("oData Tools");
    Log.log.show();
  }
  private static log: vscode.OutputChannel;
  /**
   * Use this to automatically generate message entering function "foo"
   *
   * @memberof Log
   */
  Trace(): void;
  Trace(message: any): void;
  Trace(message?: any): void {
    if (this.logLevel <= LogLevel.Trace) {
      // If no message is given get caller name
      if (!message) {
        let re = /Log\.Trace[\s\S]+?at (\w+)/g;
        let aRegexResult = re.exec(new Error().stack);
        message = "Entering function '" + aRegexResult[1] +"'";
      }

      this.LogMessage(
        "[TRACE] " + this.getLogName() + this.getMessageString(message)
      );
    }
  }

  Debug(message: any): void {
    if (this.logLevel <= LogLevel.Debug) {
      this.LogMessage(
        "[DEBUG] " + this.getLogName() + this.getMessageString(message)
      );
    }
  }

  Info(message: any): void {
    if (this.logLevel <= LogLevel.Info) {
      this.LogMessage(
        "[INFO ] " + this.getLogName() + this.getMessageString(message)
      );
    }
  }

  Warn(message: any): void {
    if (this.logLevel <= LogLevel.Warning) {
      this.LogMessage("[WARN ] " + this.getMessageString(message));
    }
  }

  Error(message: any): void {
    if (this.logLevel <= LogLevel.Error) {
      this.LogMessage("[ERROR] " + this.getMessageString(message));
    }
  }

  Fatal(message: any): void {
    if (this.logLevel <= LogLevel.Fatal) {
      this.LogMessage("[FATAL] " + this.getMessageString(message));
    }
  }

  private getMessageString(message: any): string {
    return typeof message === "string" ? message : message.toString();
  }

  private getLogName(): string {
    return this.name + ": ";
  }

  LogMessage(message: string): void {
    Log.log.appendLine(message);
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
