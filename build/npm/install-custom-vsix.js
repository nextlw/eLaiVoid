/*---------------------------------------------------------------------------------------------
 *  Script personalizado para instalar a extensão elaiRoo durante o build
 *--------------------------------------------------------------------------------------------*/

const path = require('path');
const cp = require('child_process');
const fs = require('fs');
const os = require('os');

// Caminho para o arquivo VSIX da extensão
const vsixPath = '/Users/williamduarte/NCMproduto/elaiRoo/bin/roo-cline-3.21.5.vsix';
// Destino da extensão (pasta de extensões do usuário)
const extensionsDir = path.join(os.homedir(), '.vscode/extensions');
// Nome da pasta de destino para a extensão (sem versão)
const extensionFolderName = 'roo-cline';

function log(message) {
  console.log(`[install-custom-vsix] ${message}`);
}

function findVSCodeExecutable() {
  // Executáveis do VS Code por plataforma
  const possiblePaths = [];
  
  if (process.platform === 'darwin') { // macOS
    possiblePaths.push('/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code');
    possiblePaths.push('/Applications/VSCodium.app/Contents/Resources/app/bin/code');
    possiblePaths.push('/Applications/eLaiVoid.app/Contents/Resources/app/bin/code');
  } else if (process.platform === 'win32') { // Windows
    possiblePaths.push('C:\\Program Files\\Microsoft VS Code\\bin\\code.cmd');
    possiblePaths.push('C:\\Program Files (x86)\\Microsoft VS Code\\bin\\code.cmd');
  } else { // Linux
    possiblePaths.push('/usr/bin/code');
    possiblePaths.push('/usr/local/bin/code');
  }
  
  // Verificar se os caminhos existem
  for (const codePath of possiblePaths) {
    if (fs.existsSync(codePath)) {
      return codePath;
    }
  }
  
  return null; // Nenhum executável encontrado
}

/**
 * Método alternativo: copia o VSIX para o diretório de extensões diretamente
 * sem usar o CLI ou o VS Code externo
 */
function manuallyInstallExtension() {
  log('Tentando instalação manual copiando os arquivos da extensão...');
  
  try {
    // 1. Criar diretório para a extensão se não existir
    const targetDir = path.join(extensionsDir, extensionFolderName);
    
    if (!fs.existsSync(extensionsDir)) {
      fs.mkdirSync(extensionsDir, { recursive: true });
      log(`Diretório de extensões criado: ${extensionsDir}`);
    }
    
    // 2. Remover instalação anterior se existir
    if (fs.existsSync(targetDir)) {
      log(`Removendo instalação anterior: ${targetDir}`);
      cp.execSync(`rm -rf "${targetDir}"`, { stdio: 'inherit', shell: true });
    }
    
    // 3. Extrair o VSIX para o diretório (VSIX é um arquivo ZIP)
    const tempDir = path.join(os.tmpdir(), 'vsix-extract-' + Date.now());
    fs.mkdirSync(tempDir, { recursive: true });
    
    // Extrair arquivo VSIX (que é um ZIP)
    log(`Extraindo VSIX para ${tempDir}`);
    cp.execSync(`unzip -q "${vsixPath}" -d "${tempDir}"`, { stdio: 'inherit', shell: true });
    
    // 4. Mover os arquivos extraídos para o diretório de destino
    log(`Instalando extensão em ${targetDir}`);
    fs.mkdirSync(targetDir, { recursive: true });
    cp.execSync(`cp -R "${tempDir}"/* "${targetDir}/"`, { stdio: 'inherit', shell: true });
    
    // 5. Limpar diretório temporário
    cp.execSync(`rm -rf "${tempDir}"`, { stdio: 'inherit', shell: true });
    
    log('Extensão instalada manualmente com sucesso!');
    return true;
  } catch (error) {
    log(`ERRO na instalação manual: ${error.message || error}`);
    return false;
  }
}

function installVsix() {
  log(`Instalando extensão personalizada: ${path.basename(vsixPath)}`);
  
  // Verificar se o arquivo VSIX existe
  if (!fs.existsSync(vsixPath)) {
    log(`ERRO: O arquivo VSIX não foi encontrado em: ${vsixPath}`);
    process.exit(1);
  }
  
  try {
    // Tentar vários métodos de instalação em ordem de preferência
    
    // 1. Tentar usar VS Code existente no sistema
    const vscodeExe = findVSCodeExecutable();
    if (vscodeExe) {
      log(`VS Code encontrado em: ${vscodeExe}`);
      const command = `"${vscodeExe}" --install-extension "${vsixPath}" --force`;
      
      log('Executando comando: ' + command);
      
      try {
        cp.execSync(command, {
          stdio: 'inherit',
          shell: true
        });
        log('Extensão instalada com sucesso usando VS Code!');
        return;
      } catch (err) {
        log(`Falha ao instalar com VS Code: ${err.message}`);
        // Continuar para o próximo método
      }
    }
    
    // 2. Tentar instalação manual se outros métodos falharam
    if (manuallyInstallExtension()) {
      return;
    }
    
    log('Todos os métodos de instalação falharam.');
    process.exit(1);
  } catch (error) {
    log(`ERRO ao instalar extensão: ${error.message || error}`);
    process.exit(1);
  }
}

installVsix();
