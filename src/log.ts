import chalk from "chalk";

export function logMessage(message: string, color: string = 'slate') {
  const length = 120;
  const messageLength = message.length;
  const padding = Math.floor((length - messageLength) / 2);
  const paddedMessage = "=".repeat(padding) + message + "=".repeat(padding);
  console.log(chalk.bold[color](paddedMessage));
}

export default {
  logMessage
}