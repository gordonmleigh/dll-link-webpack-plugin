import * as yarnParser from "./yarnParser";
import * as fs from "fs";

interface YarnDependency {
	version: string;
	dependencies?: PackageDependency;
}

export interface PackageDependency {
	[index: string]: YarnDependency;
}

function convertEntryToList(entry: any): string[] {
	if (typeof entry === "string") {
		return [entry];
	} else if (Array.isArray(entry)) {
		return entry;
	} else if (typeof entry === "object") {
		let list = [];
		Object.keys(entry).forEach(k => {
			list = list.concat(entry[k]);
		});
		return list;
	} else {
		throw `Incorrect entry type.`;
	}
}

export function getDependency(entry: any): PackageDependency {
	let entryList = convertEntryToList(entry);
	const packageJson = JSON.parse(fs.readFileSync("package.json").toString());
	entryList = entryList
		.map(item => {
			const version = packageJson.dependencies[item];
			return version ? `${item}@${version}` : "";
		})
		.filter(item => !!item);
	const content = fs.readFileSync("yarn.lock").toString();
	const yarnInfo = yarnParser.parse(content, "yarn.lock");

	function findDependency(entryList: string[]): PackageDependency {
		let m: PackageDependency = {};
		entryList.map(k => {
			const info = yarnInfo[k];
			let item: YarnDependency = {
				version: info.version
			};
			if (info.dependencies) {
				item.dependencies = findDependency(
					Object.keys(info.dependencies).map(
						k => `${k}@${info.dependencies[k]}`
					)
				);
			}

			m[k] = item;
		});
		return m;
	}

	return findDependency(entryList);
}
