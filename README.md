# ci-failure-explainer

[![CI](https://github.com/niuxinhuai/ci-failure-explainer/actions/workflows/ci.yml/badge.svg)](https://github.com/niuxinhuai/ci-failure-explainer/actions/workflows/ci.yml)

Extract likely failure causes, commands, files, and next fixes from CI logs.

从 CI 日志中提取失败原因、失败命令、相关文件和下一步修复建议。

## English

### Install

```bash
npm install -g ci-failure-explainer
```

For local development:

```bash
npm install
npm link
ci-failure-explainer --help
```

### Features

- Reads log files or stdin.
- Detects test, build, lint, dependency, network, permission, and quota failures.
- Reports first error-like line, file references, commands, context lines, and next steps.
- Supports Markdown and JSON output.

### Usage

```bash
ci-failure-explainer examples/github-actions.log
cat ci.log | ci-failure-explainer --context 2
ci-failure-explainer ci.log --json --max-findings 20
```

### Automation

Use JSON output when feeding the result into another automation step.

### Test

```bash
npm test
npm --cache /tmp/npm-cache pack --dry-run .
```

## 中文

### 安装

```bash
npm install -g ci-failure-explainer
```

本地开发：

```bash
npm install
npm link
ci-failure-explainer --help
```

### 功能

- 支持读取日志文件或标准输入。
- 识别测试、构建、lint、依赖、网络、权限、配额等失败类型。
- 输出首个疑似错误行、文件引用、命令、上下文和下一步建议。
- 支持 Markdown 和 JSON 输出。

### 用法

```bash
ci-failure-explainer examples/github-actions.log
cat ci.log | ci-failure-explainer --context 2
ci-failure-explainer ci.log --json --max-findings 20
```

### 自动化

Use JSON output when feeding the result into another automation step.

### 测试

```bash
npm test
npm --cache /tmp/npm-cache pack --dry-run .
```
