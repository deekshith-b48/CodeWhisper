import os
import re
import json
from typing import List, Dict, Any, Tuple
import logging
from datetime import datetime
import requests
from urllib.parse import urlparse

logger = logging.getLogger(__name__)

class DataIngestionService:
    def __init__(self):
        self.chunk_size = 1000  # Characters per chunk
        self.chunk_overlap = 200  # Overlap between chunks
        
    def process_code_file(self, file_path: str, content: str, repository: str = None, 
                         branch: str = None, commit_hash: str = None) -> List[Tuple[str, Dict[str, Any]]]:
        """
        Process a code file and return chunks with metadata
        """
        try:
            file_extension = os.path.splitext(file_path)[1].lower()
            language = self._detect_language(file_extension)
            
            # Extract functions, classes, and other code structures
            code_blocks = self._extract_code_blocks(content, language)
            
            chunks = []
            
            # If we found structured code blocks, use them
            if code_blocks:
                for i, block in enumerate(code_blocks):
                    metadata = {
                        'source_type': 'code',
                        'file_path': file_path,
                        'repository': repository,
                        'branch': branch,
                        'commit_hash': commit_hash,
                        'language': language,
                        'block_type': block['type'],
                        'block_name': block['name'],
                        'line_start': block.get('line_start'),
                        'line_end': block.get('line_end'),
                        'title': f"{block['type']}: {block['name']} in {os.path.basename(file_path)}",
                        'source_url': f"file://{file_path}#{block.get('line_start', 1)}"
                    }
                    chunks.append((block['content'], metadata))
            else:
                # Fall back to simple text chunking
                text_chunks = self._chunk_text(content)
                for i, chunk in enumerate(text_chunks):
                    metadata = {
                        'source_type': 'code',
                        'file_path': file_path,
                        'repository': repository,
                        'branch': branch,
                        'commit_hash': commit_hash,
                        'language': language,
                        'chunk_index': i,
                        'title': f"Code chunk {i+1} from {os.path.basename(file_path)}",
                        'source_url': f"file://{file_path}"
                    }
                    chunks.append((chunk, metadata))
            
            return chunks
            
        except Exception as e:
            logger.error(f"Error processing code file {file_path}: {str(e)}")
            return []
    
    def process_documentation(self, content: str, title: str = None, url: str = None, 
                            author: str = None, doc_type: str = 'markdown') -> List[Tuple[str, Dict[str, Any]]]:
        """
        Process documentation and return chunks with metadata
        """
        try:
            # Extract sections from documentation
            sections = self._extract_doc_sections(content, doc_type)
            
            chunks = []
            
            if sections:
                for i, section in enumerate(sections):
                    metadata = {
                        'source_type': 'documentation',
                        'title': section.get('title', title or f"Documentation Section {i+1}"),
                        'source_url': url or '',
                        'author': author,
                        'doc_type': doc_type,
                        'section_level': section.get('level', 1),
                        'section_title': section.get('title', ''),
                        'created_at': datetime.utcnow().isoformat()
                    }
                    chunks.append((section['content'], metadata))
            else:
                # Fall back to simple text chunking
                text_chunks = self._chunk_text(content)
                for i, chunk in enumerate(text_chunks):
                    metadata = {
                        'source_type': 'documentation',
                        'title': title or f"Documentation Chunk {i+1}",
                        'source_url': url or '',
                        'author': author,
                        'doc_type': doc_type,
                        'chunk_index': i,
                        'created_at': datetime.utcnow().isoformat()
                    }
                    chunks.append((chunk, metadata))
            
            return chunks
            
        except Exception as e:
            logger.error(f"Error processing documentation: {str(e)}")
            return []
    
    def process_slack_thread(self, messages: List[Dict[str, Any]], channel: str = None) -> List[Tuple[str, Dict[str, Any]]]:
        """
        Process Slack thread and return chunks with metadata
        """
        try:
            # Combine related messages into meaningful chunks
            thread_chunks = self._group_slack_messages(messages)
            
            chunks = []
            
            for i, chunk_data in enumerate(thread_chunks):
                # Create a readable format for the conversation
                formatted_content = self._format_slack_chunk(chunk_data['messages'])
                
                metadata = {
                    'source_type': 'slack',
                    'channel': channel,
                    'thread_ts': chunk_data.get('thread_ts'),
                    'message_count': len(chunk_data['messages']),
                    'participants': chunk_data.get('participants', []),
                    'start_time': chunk_data.get('start_time'),
                    'end_time': chunk_data.get('end_time'),
                    'title': f"Slack discussion in #{channel}" if channel else f"Slack thread {i+1}",
                    'source_url': f"slack://channel/{channel}/thread/{chunk_data.get('thread_ts', '')}"
                }
                chunks.append((formatted_content, metadata))
            
            return chunks
            
        except Exception as e:
            logger.error(f"Error processing Slack thread: {str(e)}")
            return []
    
    def _chunk_text(self, text: str) -> List[str]:
        """
        Split text into overlapping chunks
        """
        if len(text) <= self.chunk_size:
            return [text]
        
        chunks = []
        start = 0
        
        while start < len(text):
            end = start + self.chunk_size
            
            # Try to break at a sentence or paragraph boundary
            if end < len(text):
                # Look for sentence endings
                for i in range(end, max(start + self.chunk_size - 100, start), -1):
                    if text[i] in '.!?\n':
                        end = i + 1
                        break
            
            chunk = text[start:end].strip()
            if chunk:
                chunks.append(chunk)
            
            start = end - self.chunk_overlap
            if start >= len(text):
                break
        
        return chunks
    
    def _detect_language(self, file_extension: str) -> str:
        """
        Detect programming language from file extension
        """
        language_map = {
            '.py': 'python',
            '.js': 'javascript',
            '.ts': 'typescript',
            '.java': 'java',
            '.cpp': 'cpp',
            '.c': 'c',
            '.h': 'c',
            '.cs': 'csharp',
            '.go': 'go',
            '.rs': 'rust',
            '.php': 'php',
            '.rb': 'ruby',
            '.swift': 'swift',
            '.kt': 'kotlin',
            '.scala': 'scala',
            '.sql': 'sql',
            '.html': 'html',
            '.css': 'css',
            '.scss': 'scss',
            '.json': 'json',
            '.xml': 'xml',
            '.yaml': 'yaml',
            '.yml': 'yaml',
            '.md': 'markdown',
            '.sh': 'bash',
            '.dockerfile': 'dockerfile'
        }
        return language_map.get(file_extension, 'text')
    
    def _extract_code_blocks(self, content: str, language: str) -> List[Dict[str, Any]]:
        """
        Extract functions, classes, and other code structures
        """
        blocks = []
        lines = content.split('\n')
        
        if language == 'python':
            blocks.extend(self._extract_python_blocks(lines))
        elif language in ['javascript', 'typescript']:
            blocks.extend(self._extract_js_blocks(lines))
        elif language == 'java':
            blocks.extend(self._extract_java_blocks(lines))
        # Add more language-specific extractors as needed
        
        return blocks
    
    def _extract_python_blocks(self, lines: List[str]) -> List[Dict[str, Any]]:
        """
        Extract Python functions and classes
        """
        blocks = []
        current_block = None
        indent_level = 0
        
        for i, line in enumerate(lines):
            stripped = line.strip()
            
            # Function definition
            if stripped.startswith('def '):
                if current_block:
                    blocks.append(current_block)
                
                func_name = re.search(r'def\s+(\w+)', stripped)
                current_block = {
                    'type': 'function',
                    'name': func_name.group(1) if func_name else 'unknown',
                    'line_start': i + 1,
                    'content': line + '\n',
                    'indent_level': len(line) - len(line.lstrip())
                }
                indent_level = current_block['indent_level']
            
            # Class definition
            elif stripped.startswith('class '):
                if current_block:
                    blocks.append(current_block)
                
                class_name = re.search(r'class\s+(\w+)', stripped)
                current_block = {
                    'type': 'class',
                    'name': class_name.group(1) if class_name else 'unknown',
                    'line_start': i + 1,
                    'content': line + '\n',
                    'indent_level': len(line) - len(line.lstrip())
                }
                indent_level = current_block['indent_level']
            
            # Continue current block
            elif current_block and (not stripped or len(line) - len(line.lstrip()) > indent_level):
                current_block['content'] += line + '\n'
            
            # End current block
            elif current_block:
                current_block['line_end'] = i
                blocks.append(current_block)
                current_block = None
        
        # Add the last block if exists
        if current_block:
            current_block['line_end'] = len(lines)
            blocks.append(current_block)
        
        return blocks
    
    def _extract_js_blocks(self, lines: List[str]) -> List[Dict[str, Any]]:
        """
        Extract JavaScript/TypeScript functions and classes
        """
        blocks = []
        # Simplified extraction - can be enhanced
        for i, line in enumerate(lines):
            stripped = line.strip()
            
            # Function declarations
            if re.search(r'function\s+\w+|const\s+\w+\s*=.*=>|let\s+\w+\s*=.*=>', stripped):
                func_match = re.search(r'(?:function\s+(\w+)|(?:const|let)\s+(\w+))', stripped)
                if func_match:
                    func_name = func_match.group(1) or func_match.group(2)
                    blocks.append({
                        'type': 'function',
                        'name': func_name,
                        'line_start': i + 1,
                        'content': line,
                        'line_end': i + 1
                    })
            
            # Class declarations
            elif stripped.startswith('class '):
                class_match = re.search(r'class\s+(\w+)', stripped)
                if class_match:
                    blocks.append({
                        'type': 'class',
                        'name': class_match.group(1),
                        'line_start': i + 1,
                        'content': line,
                        'line_end': i + 1
                    })
        
        return blocks
    
    def _extract_java_blocks(self, lines: List[str]) -> List[Dict[str, Any]]:
        """
        Extract Java methods and classes
        """
        blocks = []
        # Simplified extraction - can be enhanced
        for i, line in enumerate(lines):
            stripped = line.strip()
            
            # Method declarations
            if re.search(r'(public|private|protected).*\s+\w+\s*\(', stripped):
                method_match = re.search(r'\s+(\w+)\s*\(', stripped)
                if method_match:
                    blocks.append({
                        'type': 'method',
                        'name': method_match.group(1),
                        'line_start': i + 1,
                        'content': line,
                        'line_end': i + 1
                    })
            
            # Class declarations
            elif re.search(r'(public|private)?\s*class\s+\w+', stripped):
                class_match = re.search(r'class\s+(\w+)', stripped)
                if class_match:
                    blocks.append({
                        'type': 'class',
                        'name': class_match.group(1),
                        'line_start': i + 1,
                        'content': line,
                        'line_end': i + 1
                    })
        
        return blocks
    
    def _extract_doc_sections(self, content: str, doc_type: str) -> List[Dict[str, Any]]:
        """
        Extract sections from documentation
        """
        sections = []
        
        if doc_type == 'markdown':
            # Split by headers
            lines = content.split('\n')
            current_section = None
            
            for line in lines:
                header_match = re.match(r'^(#{1,6})\s+(.+)', line)
                if header_match:
                    if current_section:
                        sections.append(current_section)
                    
                    level = len(header_match.group(1))
                    title = header_match.group(2)
                    current_section = {
                        'title': title,
                        'level': level,
                        'content': line + '\n'
                    }
                elif current_section:
                    current_section['content'] += line + '\n'
            
            if current_section:
                sections.append(current_section)
        
        return sections
    
    def _group_slack_messages(self, messages: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Group related Slack messages into meaningful chunks
        """
        if not messages:
            return []
        
        # Simple grouping by time proximity and thread
        chunks = []
        current_chunk = {
            'messages': [],
            'participants': set(),
            'start_time': None,
            'end_time': None,
            'thread_ts': None
        }
        
        for message in messages:
            # Start new chunk if time gap is too large (> 1 hour)
            if (current_chunk['messages'] and 
                current_chunk['end_time'] and 
                float(message.get('ts', 0)) - float(current_chunk['end_time']) > 3600):
                
                current_chunk['participants'] = list(current_chunk['participants'])
                chunks.append(current_chunk)
                current_chunk = {
                    'messages': [],
                    'participants': set(),
                    'start_time': None,
                    'end_time': None,
                    'thread_ts': None
                }
            
            current_chunk['messages'].append(message)
            current_chunk['participants'].add(message.get('user', 'unknown'))
            
            if not current_chunk['start_time']:
                current_chunk['start_time'] = message.get('ts')
            current_chunk['end_time'] = message.get('ts')
            
            if not current_chunk['thread_ts']:
                current_chunk['thread_ts'] = message.get('thread_ts', message.get('ts'))
        
        if current_chunk['messages']:
            current_chunk['participants'] = list(current_chunk['participants'])
            chunks.append(current_chunk)
        
        return chunks
    
    def _format_slack_chunk(self, messages: List[Dict[str, Any]]) -> str:
        """
        Format Slack messages into readable text
        """
        formatted_lines = []
        
        for message in messages:
            user = message.get('user', 'Unknown')
            text = message.get('text', '')
            timestamp = message.get('ts', '')
            
            # Convert timestamp to readable format if possible
            try:
                dt = datetime.fromtimestamp(float(timestamp))
                time_str = dt.strftime('%Y-%m-%d %H:%M')
            except:
                time_str = timestamp
            
            formatted_lines.append(f"[{time_str}] {user}: {text}")
        
        return '\n'.join(formatted_lines)

