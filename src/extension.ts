import * as vscode from "vscode";
import { HuggingFaceChatModelProvider } from "./provider";

export function activate(context: vscode.ExtensionContext) {
	// Build a descriptive User-Agent to help quantify API usage
	const ext = vscode.extensions.getExtension("HuggingFace.huggingface-vscode-chat");
	const extVersion = ext?.packageJSON?.version ?? "unknown";
	const vscodeVersion = vscode.version;
	// Keep UA minimal: only extension version and VS Code version
	const ua = `huggingface-vscode-chat/${extVersion} VSCode/${vscodeVersion}`;

	const provider = new HuggingFaceChatModelProvider(context.secrets, ua);
	// Register the Hugging Face provider under the vendor id used in package.json
	vscode.lm.registerLanguageModelChatProvider("huggingface", provider);

	// Management command to configure API key and optional organization billing
	context.subscriptions.push(
		vscode.commands.registerCommand("huggingface.manage", async () => {
			const existing = await context.secrets.get("huggingface.apiKey");
			const apiKey = await vscode.window.showInputBox({
				title: "Hugging Face API Key",
				prompt: existing ? "Update your Hugging Face API key" : "Enter your Hugging Face API key",
				ignoreFocusOut: true,
				password: true,
				value: existing ?? "",
			});
			if (apiKey === undefined) {
				return; // user canceled
			}
			if (!apiKey.trim()) {
				await context.secrets.delete("huggingface.apiKey");
				vscode.window.showInformationMessage("Hugging Face API key cleared.");
			} else {
				await context.secrets.store("huggingface.apiKey", apiKey.trim());
				vscode.window.showInformationMessage("Hugging Face API key saved.");
			}

			const config = vscode.workspace.getConfiguration("huggingface");
			const existingBillTo = config.get<string>("billTo") ?? "";
			const billTo = await vscode.window.showInputBox({
				title: "Hugging Face Organization Billing",
				prompt: "Optional org name to bill inference requests to",
				ignoreFocusOut: true,
				value: existingBillTo,
			});
			if (billTo === undefined) {
				return; // user canceled
			}
			await config.update("billTo", billTo.trim(), vscode.ConfigurationTarget.Global);
			if (!billTo.trim()) {
				vscode.window.showInformationMessage("Hugging Face organization billing cleared.");
			} else {
				vscode.window.showInformationMessage("Hugging Face organization billing saved.");
			}
		})
	);
}

export function deactivate() {}
