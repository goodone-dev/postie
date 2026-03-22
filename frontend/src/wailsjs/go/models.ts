export namespace collection {
	
	export class CollectionResponse {
	    id: number[];
	    name: string;
	    slug: string;
	    is_favorite: boolean;
	
	    static createFrom(source: any = {}) {
	        return new CollectionResponse(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.slug = source["slug"];
	        this.is_favorite = source["is_favorite"];
	    }
	}
	export class CreateCollectionRequest {
	    workspace_id: number[];
	    name: string;
	
	    static createFrom(source: any = {}) {
	        return new CreateCollectionRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.workspace_id = source["workspace_id"];
	        this.name = source["name"];
	    }
	}
	export class MoveCollectionRequest {
	    target_workspace_id: number[];
	
	    static createFrom(source: any = {}) {
	        return new MoveCollectionRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.target_workspace_id = source["target_workspace_id"];
	    }
	}

}

export namespace workspace {
	
	export class CreateWorkspaceRequest {
	    name: string;
	
	    static createFrom(source: any = {}) {
	        return new CreateWorkspaceRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	    }
	}
	export class WorkspaceResponse {
	    id: number[];
	    name: string;
	    slug: string;
	
	    static createFrom(source: any = {}) {
	        return new WorkspaceResponse(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.slug = source["slug"];
	    }
	}

}

