/**
 * 功能概述：检查仓库中的关键目录边界，避免 Web 端深层引用 package 内部实现，或浏览器 API 泄漏进核心规则层。
 * 输入输出：输入仓库内的 TypeScript 源码文件；输出校验结果并在发现越界时返回非零退出码。
 * 处理流程：扫描 apps、packages、tools 下的源码，匹配受限 import 与受限全局 API，再汇总报告。
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, relative } from "node:path";

const REPO_ROOT = process.cwd();
const SOURCE_EXTENSIONS = new Set([".ts", ".tsx"]);
const SCAN_ROOTS = [
  "apps/web/src",
  "packages/game-core/src",
  "packages/game-content/src",
  "tools",
];

interface Violation {
  file: string;
  message: string;
}

function walkFiles(root: string): string[] {
  const absoluteRoot = join(REPO_ROOT, root);
  const entries = readdirSync(absoluteRoot, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = join(absoluteRoot, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === "dist") {
        continue;
      }
      files.push(...walkFiles(relative(REPO_ROOT, fullPath)));
      continue;
    }
    if (SOURCE_EXTENSIONS.has(extname(entry.name))) {
      files.push(fullPath);
    }
  }

  return files;
}

function collectSourceFiles(): string[] {
  return SCAN_ROOTS.flatMap((root) => {
    const absoluteRoot = join(REPO_ROOT, root);
    try {
      if (!statSync(absoluteRoot).isDirectory()) {
        return [];
      }
      return walkFiles(root);
    } catch {
      return [];
    }
  });
}

function findViolations(filePath: string): Violation[] {
  const content = readFileSync(filePath, "utf8");
  const repoRelativePath = relative(REPO_ROOT, filePath);
  const violations: Violation[] = [];

  if (repoRelativePath.startsWith("apps/web/src/")) {
    if (/@steam\/game-core\/src\//.test(content) || /@steam\/game-content\/src\//.test(content)) {
      violations.push({
        file: repoRelativePath,
        message: "apps/web 只能通过 package 入口引用 @steam/game-core 和 @steam/game-content。",
      });
    }
    if (/from\s+["'][.]{2,}\/[.\/]*packages\//.test(content)) {
      violations.push({
        file: repoRelativePath,
        message: "apps/web 不应通过相对路径直接越过 packages 边界。",
      });
    }
  }

  if (repoRelativePath.startsWith("packages/game-core/src/")) {
    const forbiddenPatterns: Array<{ pattern: RegExp; message: string }> = [
      {
        pattern: /from\s+["']react["']|from\s+["']react-dom["']/,
        message: "game-core 不能依赖 React 或 react-dom。",
      },
      {
        pattern: /\bwindow\./,
        message: "game-core 不能直接访问 window。",
      },
      {
        pattern: /\bdocument\./,
        message: "game-core 不能直接访问 document。",
      },
      {
        pattern: /\blocalStorage\b/,
        message: "game-core 不能直接访问 localStorage。",
      },
    ];

    for (const rule of forbiddenPatterns) {
      if (rule.pattern.test(content)) {
        violations.push({
          file: repoRelativePath,
          message: rule.message,
        });
      }
    }
  }

  if (repoRelativePath.startsWith("packages/game-content/src/")) {
    if (/from\s+["'][.]{2,}\/[.\/]*apps\/web\//.test(content) || /from\s+["']@steam\/web["']/.test(content)) {
      violations.push({
        file: repoRelativePath,
        message: "game-content 不能依赖 apps/web。",
      });
    }
  }

  return violations;
}

function main() {
  const violations = collectSourceFiles().flatMap(findViolations);

  if (violations.length === 0) {
    console.log("目录边界检查通过。");
    return;
  }

  console.error("发现目录边界违规：");
  for (const violation of violations) {
    console.error(`- ${violation.file}: ${violation.message}`);
  }
  process.exitCode = 1;
}

main();
