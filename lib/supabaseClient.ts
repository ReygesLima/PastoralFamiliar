
import { createClient } from '@supabase/supabase-js';

// As chaves fornecidas são do tipo 'anon', que são seguras para serem expostas no lado do cliente (navegador),
// desde que as Row Level Security (RLS) policies estejam devidamente configuradas no seu painel do Supabase.

// Valores Padrão
const defaultSupabaseUrl = 'https://yquqzbxfmwsfjpetdngz.supabase.co';
const defaultSupabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxdXF6YnhmbXdzZmpwZXRkbmd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MDU0NjUsImV4cCI6MjA3ODA4MTQ2NX0.OW4CZUW4knhPXeQ5XT5L0OmAwhZWJASO8_mqq2blVkA';

// Tenta obter as credenciais do localStorage; se não existirem, usa os valores padrão.
// Isso permite que o usuário configure suas próprias chaves através da interface.
const supabaseUrl = localStorage.getItem('supabaseUrl') || defaultSupabaseUrl;
const supabaseKey = localStorage.getItem('supabaseKey') || defaultSupabaseKey;


// Especificamos o tipo do banco de dados para ter um type-safe client.
// Assumimos que existe uma tabela 'membros_pastoral' que corresponde à interface 'Member'.
export const supabase = createClient(supabaseUrl, supabaseKey);